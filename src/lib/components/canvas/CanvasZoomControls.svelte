<script lang="ts">
  import type { Camera } from '$lib/canvas/types'

  let { camera = $bindable() } = $props<{ camera: Camera }>()

  function resetView() {
    camera = { x: 0, y: 0, scale: 1 }
  }
</script>

<div class="pointer-events-auto fixed bottom-6 right-6 z-30 flex flex-col gap-2">
  <button
    type="button"
    class="toolbar-pill flex h-10 w-10 items-center justify-center transition hover:border-slate-700 hover:bg-slate-900"
    onclick={() => {
      camera = { ...camera, scale: Math.min(camera.scale * 1.2, 5) }
    }}
    title="Zoom in"
  >
    +
  </button>
  <button
    type="button"
    class="toolbar-pill flex h-10 w-10 items-center justify-center transition hover:border-slate-700 hover:bg-slate-900"
    onclick={() => {
      camera = { ...camera, scale: Math.max(camera.scale * 0.8, 0.1) }
    }}
    title="Zoom out"
  >
    -
  </button>
  <button
    type="button"
    class="toolbar-pill flex h-10 w-10 items-center justify-center text-[11px] font-semibold transition hover:border-slate-700 hover:bg-slate-900"
    onclick={resetView}
    title="Reset view"
  >
    {Math.round(camera.scale * 100)}%
  </button>
</div>
