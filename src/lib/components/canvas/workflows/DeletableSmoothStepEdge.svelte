<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getSmoothStepPath,
    useSvelteFlow,
    type EdgeProps
  } from '@xyflow/svelte'
  import { Trash2 } from 'lucide-svelte'

  type SmoothStepPathOptions = {
    borderRadius?: number
    offset?: number
    stepPosition?: number
  }

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    markerEnd,
    interactionWidth,
    label,
    labelStyle,
    style,
    selected = false,
    deletable = true,
    pathOptions
  }: EdgeProps & { pathOptions?: SmoothStepPathOptions } = $props()

  const { deleteElements } = useSvelteFlow()

  let [path, labelX, labelY] = $derived(
    getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: pathOptions?.borderRadius,
      offset: pathOptions?.offset,
      stepPosition: pathOptions?.stepPosition
    })
  )

  function stopGraphControlEvent(event: Event) {
    event.stopPropagation()
  }

  async function deleteEdge(event: MouseEvent) {
    stopGraphControlEvent(event)
    event.preventDefault()
    if (!id) return
    await deleteElements({ edges: [{ id }] })
  }
</script>

<BaseEdge
  {id}
  {path}
  {labelX}
  {labelY}
  {label}
  {labelStyle}
  {markerStart}
  {markerEnd}
  {interactionWidth}
  {style}
/>

{#if selected && deletable}
  <EdgeLabel x={labelX} y={labelY} class="transparent">
    <button
      type="button"
      class="nodrag nopan flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition hover:border-destructive/60 hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Delete connector"
      title="Delete connector"
      onpointerdown={stopGraphControlEvent}
      onclick={deleteEdge}
    >
      <Trash2 class="size-3" aria-hidden="true" />
    </button>
  </EdgeLabel>
{/if}
