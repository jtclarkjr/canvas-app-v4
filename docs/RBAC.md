# Role-Based Access Control (RBAC)

Canvas sharing is built around four roles. The server is the single source of
truth for authorization — all client-side gating is UX only and every API
route re-checks the caller's role on each request.

## Roles

| Role | How it is granted | Capabilities |
| --- | --- | --- |
| `owner` | Implicit: `canvases.created_by`. Not stored in `canvas_members`, cannot be changed or removed. | Everything: edit all elements, rename, delete the canvas, manage members and access requests. |
| `admin` | Row in `canvas_members` | Edit **all** elements, rename the canvas, open the full share dialog, add/remove members, change roles, approve/deny access requests. Cannot delete the canvas. |
| `editor` | Row in `canvas_members` | Draw and create elements; edit, move, erase, and delete **only elements they created** (`canvas_elements.created_by`). Cannot rename the canvas or manage sharing. |
| `reader` | Row in `canvas_members` | View only: pan, zoom, hover. Appears in presence (avatar + live cursor). Locked to the hand tool; cannot draw, edit, delete, or rename. |

Role precedence: `owner (3) > admin (2) > editor (1) > reader (0)` — see
`ROLE_RANK` / `roleAtLeast()` in `src/lib/canvas/roles.ts`.

Notes:

- Elements with `created_by IS NULL` (rows that predate the sharing
  migration backfill) are editable by owner/admin only; editors are denied.
- Any member (including readers) may remove **themselves** from a canvas.
- Everyone with access can copy the share link; only owner/admin see the
  member-management sections of the share dialog.

## Canvas visibility (public/private)

Each canvas has a `visibility` setting (`canvases.visibility`):

- `private` (default) — only the owner and `canvas_members` rows have access;
  everyone else gets the request-access screen.
- `public` — any **signed-in** user can open the canvas readonly without a
  membership row. Logged-out visitors are still redirected to `/login`.

Owner/admin flip the switch in the share dialog's **General access** section
(`PATCH /api/canvases/[id]` with `{ visibility }`, min role admin).

A roleless visitor on a public canvas is a **public viewer**: the server
synthesizes an effective `reader` role for read endpoints, but no
`canvas_members` row exists. Public viewers — and **reader members** on any
canvas — see a banner (`RequestEditAccessBanner.svelte`) offering **Request
edit access**, which creates a normal access request with
`requested_role = 'editor'`; the admin approval picker defaults to the
requested role. Approval upserts a real membership and the viewer upgrades
live (same realtime flow as the request-access screen).

Existing members may request a **role upgrade** (requested role above their
current role); any other request from a member is rejected with
`already_member`. If the admin approves an editor request with a lower role
(e.g. grants `reader`), the requester is told their edit request was not
approved but view access was granted, lands as a reader, and the banner
returns so they can request the editor role again.

Flipping public→private kicks roleless public viewers out in realtime: they
watch the `canvases` row (`canvas:{id}:visibility` channel) and re-run the
page load when `visibility` becomes `private`, landing on the request-access
screen. Members are unaffected by visibility changes. Conversely, a visitor
waiting on the request-access screen auto-enters readonly if the canvas goes
public (`canvas:{id}:visibility-watch`).

Error-code semantics: `canvas_access_denied` is only thrown when the canvas
is private (it routes the client to the request-access screen and doubles as
the kick fallback if a realtime event is missed). A public viewer attempting
a write gets `insufficient_role` instead, so they are not bounced out of the
canvas.

## Share links and the request-access flow

A share link is just the canvas URL (`/canvas/<id>`). Links grant no role;
on a **public** canvas the link is enough to view readonly (signed-in users
only) — the flow below describes **private** canvases.

1. **Unauthenticated** visitor → redirected to `/login?redirect=…`
   (`src/hooks.server.ts`).
2. **Authenticated non-member** → the page load
   (`src/routes/canvas/[canvasId]/+page.server.ts`) resolves access
   server-side and renders `RequestAccessScreen` instead of the workspace.
   A canvas that does not exist renders a "Canvas not found" screen — 404 is
   reserved for genuinely missing canvases, never used to mask denial.
3. The visitor clicks **Request access**, creating a `pending` row in
   `canvas_access_requests` (one live pending request per user per canvas,
   enforced by a partial unique index).
4. Owner/admins on the canvas receive a **realtime toast + badge** on the
   share button. Approving (with a role picker, default `reader`) upserts a
   `canvas_members` row and marks the request `approved`.
5. The waiting requester's screen is subscribed to its request row and
   **auto-enters the canvas** on approval (no refresh). Denied requests show
   a "request again" state.

Revocation is also live: if a member's row is updated or deleted, their
client re-runs the page load immediately (workspace `canvas_members`
listener) and falls back to the request-access screen; any in-flight API
call that returns 403 `canvas_access_denied` triggers the same.

## Data model

Defined in `supabase/migrations/` (baseline = pre-existing schema; sharing =
this feature). Types mirrored in `src/lib/server/database.types.ts`.

```
profiles                 one-to-one with auth.users, synced by trigger
  id, email, display_name, avatar_url, avatar_color, last_seen, …

canvases                 owner = created_by (auth.users)
  id, title, created_by, created_at,
  visibility (enum: private | public, default private)

canvas_members           role enum: admin | editor | reader
  id, canvas_id, user_id, role, invited_by, created_at, updated_at
  unique (canvas_id, user_id); replica identity full (realtime DELETEs)

canvas_access_requests   status enum: pending | approved | denied
  id, canvas_id, requester_id, status, requested_role, resolved_by,
  resolved_role, …
  partial unique index on (canvas_id, requester_id) where status = 'pending'
  requested_role: role the requester asked for (public viewers request
  'editor'); null = unspecified, approval picker defaults to 'reader'

canvas_elements
  …, created_by (element author — drives editor permissions), updated_by
```

`public.profiles` is kept in sync with `auth.users` by the
`sync_profile_from_auth_user()` trigger (insert + update) so member search
and member lists have emails/names/avatars. Existing users were backfilled.

## Server enforcement

`src/lib/server/canvas-access.ts`:

- `resolveCanvasAccess(supabase, canvasId, userId)` →
  `{ canvas, role | null, publicAccess }`. `role` is always the **actual**
  membership role (null for public viewers). Throws 404 `canvas_not_found`
  if the canvas does not exist.
- `requireCanvasRole(supabase, canvasId, userId, min)` →
  `{ canvas, role, isPublicViewer }`. For roleless users: throws 403
  `canvas_access_denied` when the canvas is private (this is what routes the
  client to the request-access screen); on a public canvas, returns a
  synthesized `reader` role when `min` is `reader` and throws 403
  `insufficient_role` for anything higher. Members below `min` also get
  `insufficient_role`.

Route authorization matrix:

| Endpoint | Minimum role |
| --- | --- |
| `GET /api/canvases` | any auth (returns owned + shared, each with `role`) |
| `GET /api/canvases/[id]` | reader (incl. public viewers) |
| `PATCH /api/canvases/[id]` (rename, visibility) | admin |
| `DELETE /api/canvases/[id]` | owner |
| `GET /api/canvases/[id]/elements` | reader |
| `POST /api/canvases/[id]/elements` | editor — update path additionally requires `created_by = caller` unless admin/owner; element ids cannot be reused across canvases |
| `DELETE /api/canvases/[id]/elements/[elementId]` | editor — own elements only unless admin/owner |
| `GET/POST /api/canvases/[id]/members`, `PATCH/DELETE /api/canvases/[id]/members/[userId]` | admin (exception: self-leave via DELETE needs reader) |
| `GET /api/canvases/[id]/access-requests`, `PATCH …/[requestId]` | admin |
| `POST /api/canvases/[id]/access-requests`, `GET …/me` | any auth (idempotent for an existing pending request; optional `{ requestedRole }` body, re-requests update the pending row's requested_role; members may only request a role above their current one) |
| `GET /api/users/search?q=` | any auth (min 2 chars, max 10 results, excludes self) |

Error codes the client branches on (serialized by
`src/lib/server/api-error.ts`, surfaced via `ApiClientError.code`):
`canvas_not_found`, `canvas_access_denied`, `insufficient_role`,
`element_not_found`, `element_forbidden`, `already_member`,
`cannot_modify_owner`, `member_not_found`, `request_not_found`,
`request_already_resolved`.

## Realtime + RLS

The server uses the service-role key (bypasses RLS); all writes go through
the API. RLS exists to scope what **clients** can read directly — which is
what authorizes realtime `postgres_changes` subscriptions:

- `canvas_access_requests`: readable by the requester and canvas
  owner/admins (`is_canvas_admin()`), so request notifications are only
  delivered to people allowed to act on them, as a database guarantee.
- `canvas_members`: readable by anyone with access to the canvas
  (`can_view_canvas()`), powering live revocation handling. Note: on
  RLS-enabled tables, realtime DELETE payloads strip the old record to the
  primary key, so the workspace resolves its own membership row id up front
  and matches removals by that id (see the membership effect in
  `CanvasWorkspace.svelte`). Removal kicks the user to the request-access
  screen immediately; a role change re-resolves the page and re-gates the
  workspace in place.
- `profiles`: self-only select (pre-existing); user search goes through the
  server API.
- `canvases` / `canvas_elements`: pre-existing broad authenticated-read
  policies are unchanged so the existing element-sync subscription keeps
  working. Tightening these to member-scoped reads is possible later but
  must be verified against the element realtime channel first.

Because the new policies are user-scoped, clients call
`supabase.realtime.setAuth(<access_token>)` before subscribing (see
`RequestAccessScreen.svelte` and the workspace notification effects).

Channels used per canvas: `canvas:{id}:drawings` (element sync, pre-existing),
`{id}` (presence/cursors, pre-existing), `canvas:{id}:access-requests`
(owner/admin notifications), `canvas:{id}:my-access` (requester waiting for
approval), `canvas:{id}:membership` (member revocation/role changes),
`canvas:{id}:visibility` (public viewers watching for a public→private kick),
`canvas:{id}:visibility-watch` (request-access screen auto-entering on
private→public), `canvas:{id}:my-edit-request` (public viewer or reader
waiting for editor approval). The visibility channels ride on the
pre-existing broad authenticated SELECT policy on `canvases`.

Known limitation: the presence/cursor channel is a public broadcast channel —
anyone who knows the canvas UUID can join it. Proper scoping needs Supabase
private channels and is out of scope here.

## Client gating (UX only)

`CanvasWorkspace.svelte` receives `role` from the page load:

- `canEdit` (`role !== 'reader'`) — readers are forced onto the hand tool,
  the SVG layer keeps `pointer-events: none`, and the toolbar
  (`CanvasToolbar readOnly`) hides edit tools.
- `canManageCanvas` (owner/admin) — gates title editing and the share
  dialog's management sections (including the General access visibility
  switch).
- `isPublicViewer` — public viewers render readonly (`role='reader'`) plus
  the visibility kick subscription. The `RequestEditAccessBanner`
  request-editor affordance renders for public viewers and reader members
  alike.
- `canModifyElement(id)` — editors are checked against an element-ownership
  map (`created_by`, maintained from the initial load, realtime inserts, and
  local creates); selection, drag, erase, double-click-edit, and delete all
  filter through it.

UI entry points: `CanvasOptionsButton.svelte` (share button right of the
presence avatars: Share… / Copy link, pending-request badge),
`ShareDialog.svelte` (link, add people via search, members list with role
editing, pending requests), `RoleBadge.svelte`, and the "Shared with me"
section in `CanvasHome.svelte`.

## Applying the schema

The migrations in `supabase/migrations/` must be applied to the Supabase
project before any of this works (Dashboard SQL editor or `supabase db
push`). The baseline file matches the pre-existing live schema and is
rerunnable; the sharing migration is the one that adds the RBAC objects;
the canvas-visibility migration (`20260612000000_canvas_visibility.sql`)
adds `canvases.visibility` and `canvas_access_requests.requested_role`.
