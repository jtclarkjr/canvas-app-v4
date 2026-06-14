import { json, type RequestHandler } from '@sveltejs/kit'
import { deleteElementResponseSchema } from '$lib/workspace/schema'
import { requireCanvasRole } from '$lib/server/canvas-access'
import { toCanvasElement } from '$lib/server/canvas-elements'
import {
  forbidden,
  handleApiError,
  notFound,
  withAccountAuth
} from '$lib/server/api-error'
import { withRateLimit } from '$lib/server/rate-limit'
import { getSupabase } from '$lib/server/supabase'

export const DELETE: RequestHandler = async (event) =>
  withRateLimit(async () => {
    try {
      const supabase = getSupabase()
      const user = withAccountAuth(event.locals.user)
      const canvasId = event.params.canvasId
      const elementId = event.params.elementId

      if (!canvasId || !elementId) {
        return json(
          { message: 'Canvas id and element id are required.' },
          { status: 400 }
        )
      }

      const { role } = await requireCanvasRole(
        supabase,
        canvasId,
        user.id,
        'editor'
      )

      const { data: existing, error: existingError } = await supabase
        .from('canvas_elements')
        .select('id, created_by')
        .eq('id', elementId)
        .eq('canvas_id', canvasId)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (!existing) {
        throw notFound('Element not found.', {
          code: 'element_not_found',
          details: { elementId }
        })
      }

      if (role === 'editor' && existing.created_by !== user.id) {
        throw forbidden('You can only delete elements you created.', {
          code: 'element_forbidden',
          details: { elementId }
        })
      }

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

      return json(
        deleteElementResponseSchema.parse({
          item: toCanvasElement(data)
        })
      )
    } catch (error) {
      return handleApiError(error, event.request)
    }
  })({ request: event.request })
