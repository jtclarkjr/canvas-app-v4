import { json, type RequestHandler } from '@sveltejs/kit'
import {
  listElementsResponseSchema,
  upsertElementInputSchema,
  upsertElementResponseSchema
} from '$lib/canvas/schema'
import { ensureUserOwnsCanvas } from '$lib/server/canvas-access'
import {
  handleApiError,
  parseInput,
  parseJsonBody,
  withAuth
} from '$lib/server/api-error'
import { withRateLimit } from '$lib/server/rate-limit'
import { getSupabase } from '$lib/server/supabase'

const toElement = (row: {
  id: string
  canvas_id: string
  type: string
  data: unknown
  x: number
  y: number
  z: number | null
  updated_by: string | null
  updated_at: string
}) => ({
  id: row.id,
  canvasId: row.canvas_id,
  type: row.type,
  data: row.data,
  x: row.x,
  y: row.y,
  z: row.z,
  updatedBy: row.updated_by,
  updatedAt: row.updated_at
})

export const GET: RequestHandler = async (event) =>
  withRateLimit(async () => {
    try {
      const supabase = getSupabase()
      const user = withAuth(event.locals.user)
      const canvasId = event.params.canvasId

      if (!canvasId) {
        return json({ message: 'Canvas id is required.' }, { status: 400 })
      }

      await ensureUserOwnsCanvas(supabase, canvasId, user.id)

      const { data, error } = await supabase
        .from('canvas_elements')
        .select('*')
        .eq('canvas_id', canvasId)
        .order('updated_at', { ascending: true })

      if (error) {
        throw error
      }

      return json(
        listElementsResponseSchema.parse({
          items: (data ?? []).map(toElement)
        })
      )
    } catch (error) {
      return handleApiError(error, event.request)
    }
  })({ request: event.request })

export const POST: RequestHandler = async (event) =>
  withRateLimit(async () => {
    try {
      const supabase = getSupabase()
      const user = withAuth(event.locals.user)
      const canvasId = event.params.canvasId

      if (!canvasId) {
        return json({ message: 'Canvas id is required.' }, { status: 400 })
      }

      await ensureUserOwnsCanvas(supabase, canvasId, user.id)

      const payload = await parseJsonBody(event.request)
      const input = parseInput(upsertElementInputSchema, payload)

      const row = {
        ...(input.id ? { id: input.id } : {}),
        canvas_id: canvasId,
        type: input.type,
        data: input.data ?? null,
        x: input.x,
        y: input.y,
        z: input.z ?? null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('canvas_elements')
        .upsert(row)
        .select()
        .single()

      if (error || !data) {
        throw error ?? new Error('Failed to upsert canvas element')
      }

      return json(
        upsertElementResponseSchema.parse({ item: toElement(data) }),
        { status: 201 }
      )
    } catch (error) {
      return handleApiError(error, event.request)
    }
  })({ request: event.request })
