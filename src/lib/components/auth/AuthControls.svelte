<script lang="ts">
  import { page } from '$app/state'
  import { getUserAvatarUrl, getUserDisplayName } from '$lib/auth/user-profile'
  import { signOut } from '$lib/auth/session-service'
  import { session } from '$lib/stores/session.svelte'
  import { theme, type Theme } from '$lib/stores/theme.svelte'

  const themeOptions: Theme[] = ['light', 'dark', 'system']

  const loginHref = $derived(
    `/login?redirect=${encodeURIComponent(`${page.url.pathname}${page.url.search}`)}`
  )
  const userDisplayName = $derived(
    session.data?.user ? getUserDisplayName(session.data.user) : 'Guest'
  )
  const userAvatarUrl = $derived(
    session.data?.user ? getUserAvatarUrl(session.data.user) : null
  )
  const userInitial = $derived(userDisplayName.charAt(0).toUpperCase() || 'U')

  let avatarLoadFailed = $state(false)
  let lastUserAvatarUrl = $state<string | null>(null)

  $effect(() => {
    if (userAvatarUrl !== lastUserAvatarUrl) {
      lastUserAvatarUrl = userAvatarUrl
      avatarLoadFailed = false
    }
  })

  function cycleTheme() {
    const index = themeOptions.indexOf(theme.current)
    const next = themeOptions[(index + 1) % themeOptions.length]
    if (next) {
      theme.set(next)
    }
  }
</script>

<div class="flex items-center gap-2">
  <button
    type="button"
    class="surface-border rounded-full bg-card/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
    onclick={cycleTheme}
    title="Toggle theme"
  >
    {theme.current}
  </button>

  {#if session.data?.user}
    <div
      class="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 py-2 shadow-sm"
    >
      <div
        class="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        {#if userAvatarUrl && !avatarLoadFailed}
          <img
            src={userAvatarUrl}
            alt={`${userDisplayName} avatar`}
            class="size-full object-cover"
            onerror={() => {
              avatarLoadFailed = true
            }}
          />
        {:else}
          {userInitial}
        {/if}
      </div>
      <span class="hidden max-w-32 truncate text-sm font-medium text-foreground sm:inline">
        {userDisplayName}
      </span>
      <button
        type="button"
        class="rounded-full bg-secondary px-3 py-1 text-sm font-medium transition hover:bg-accent"
        onclick={() => void signOut()}
      >
        Sign Out
      </button>
    </div>
  {:else}
    <a
      class="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
      href={loginHref}
    >
      Sign In
    </a>
  {/if}
</div>
