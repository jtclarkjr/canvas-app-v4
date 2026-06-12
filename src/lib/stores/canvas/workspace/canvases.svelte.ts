import { listCanvases, updateCanvas } from '$lib/canvas/api'
import type { Canvas, CanvasVisibility } from '$lib/canvas/schema'

type WorkspaceCanvasesInput = {
  getActiveCanvasId: () => string
  getFallbackTitle?: () => string
}

export function createWorkspaceCanvasesStore({
  getActiveCanvasId,
  getFallbackTitle
}: WorkspaceCanvasesInput) {
  let canvases = $state<Canvas[]>([])
  let error = $state<string | null>(null)
  let isLoading = $state(false)

  function currentCanvas() {
    return canvases.find((canvas) => canvas.id === getActiveCanvasId()) ?? null
  }

  function setError(message: string | null) {
    error = message
  }

  async function loadCanvasesList() {
    isLoading = true
    error = null

    try {
      const response = await listCanvases()
      canvases = response.items
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : 'Failed to load canvases.'
    } finally {
      isLoading = false
    }
  }

  async function saveTitle(title: string) {
    const canvas = currentCanvas()
    if (!canvas || !title.trim()) {
      return
    }

    try {
      const response = await updateCanvas(canvas.id, {
        title: title.trim()
      })
      canvases = canvases.map((entry) => (entry.id === canvas.id ? response.item : entry))
    } catch (saveError) {
      error = saveError instanceof Error ? saveError.message : 'Failed to update title.'
    }
  }

  async function saveVisibility(visibility: CanvasVisibility) {
    const canvas = currentCanvas()
    if (!canvas) {
      return
    }

    const response = await updateCanvas(canvas.id, { visibility })
    canvases = canvases.map((entry) => (entry.id === canvas.id ? response.item : entry))
  }

  return {
    loadCanvasesList,
    saveTitle,
    saveVisibility,
    setError,
    get canvases() {
      return canvases
    },
    get currentCanvasTitle() {
      return currentCanvas()?.title ?? getFallbackTitle?.() ?? ''
    },
    get currentCanvasVisibility() {
      return currentCanvas()?.visibility ?? 'private'
    },
    get error() {
      return error
    },
    get isLoading() {
      return isLoading
    }
  }
}
