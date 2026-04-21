import { json, type RequestHandler } from '@sveltejs/kit'
import { deleteElementResponseSchema } from '$lib/canvas/schema'
import { ensureUserOwnsCanvas } from '$lib/server/canvas-access'
import { handleApiError, notFound, withAuth } from '$lib/server/api-error'
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

export const DELETE: RequestHandler = async (event) =>
  withRateLimit(async () => {
    try {
      const supabase = getSupabase()
      const user = withAuth(event.locals.user)
      const canvasId = event.params.canvasId
      const elementId = event.params.elementId

      if (!canvasId || !elementId) {
        return json(
          { message: 'Canvas id and element id are required.' },
          { status: 400 }
        )
      }

      await ensureUserOwnsCanvas(supabase, canvasId, user.id)

      const { data, error } = await supabase
        .from('canvas_elements')
        .delete()
        .eq('id', elementId)
        .eq('canvas_id', canvasId)
        .select()
        .single()

      if (error || !data) {
        throw notFound('Element not found.', {
          code: 'element_not_found',
          details: { elementId }
        })
      }

      return json(deleteElementResponseSchema.parse({ item: toElement(data) }))
    } catch (error) {
      return handleApiError(error, event.request)
    }
  })({ request: event.request })
