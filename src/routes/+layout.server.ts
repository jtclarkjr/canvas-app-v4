import type { LayoutServerLoad } from './$types'
import { CANVASES_DEPENDENCY } from '$lib/canvas/dependencies'
import { getAuthConfig } from '$lib/server/auth-config'
import {
  createEmptyCanvasListData,
  listCanvasesForUser,
  type CanvasListData
} from '$lib/server/canvas-list'
import { getSupabase } from '$lib/server/supabase'

function canvasListError(error: unknown): CanvasListData {
  return {
    items: [],
    error: error instanceof Error ? error.message : 'Failed to load canvases.'
  }
}

export const load: LayoutServerLoad = async ({ depends, locals }) => {
  depends(CANVASES_DEPENDENCY)

  const user = locals.user
  const baseData = {
    authConfig: getAuthConfig(),
    user
  }

  if (!user) {
    return {
      ...baseData,
      canvasList: createEmptyCanvasListData()
    }
  }

  try {
    return {
      ...baseData,
      canvasList: {
        ...(await listCanvasesForUser(getSupabase(), user.id)),
        error: null
      }
    }
  } catch (error) {
    return {
      ...baseData,
      canvasList: canvasListError(error)
    }
  }
}
