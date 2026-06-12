<script lang="ts">
  import CanvasHome from '$lib/components/canvas/CanvasHome.svelte'
  import type { PageData } from './$types'

  let { data } = $props<{ data: PageData }>()
</script>

<CanvasHome
  initialCanvases={data.canvasList.items}
  initialError={data.canvasList.error}
  user={data.user}
/>
