<script lang="ts">
  import CanvasWorkspace from '$lib/components/canvas/CanvasWorkspace.svelte'

  let { data } = $props<{
    data: {
      canvasId: string
      userId?: string
      userEmail?: string
    }
  }>()
</script>

<CanvasWorkspace canvasId={data.canvasId} userId={data.userId ?? ''} userEmail={data.userEmail} />
