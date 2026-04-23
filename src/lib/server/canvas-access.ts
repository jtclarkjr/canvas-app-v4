import type { SupabaseClient } from '@supabase/supabase-js'
import { notFound } from '$lib/server/api-error'
import type { Database } from '$lib/server/database.types'

export async function ensureUserOwnsCanvas(
  supabase: SupabaseClient<Database>,
  canvasId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('canvases')
    .select('id')
    .eq('id', canvasId)
    .eq('created_by', userId)
    .single()

  if (error || !data) {
    throw notFound('Canvas not found.', {
      code: 'canvas_not_found',
      details: { canvasId }
    })
  }
}
