<script lang="ts">
  import { Database, GitBranch, Maximize2, Trash2 } from 'lucide-svelte'
  import type { Camera } from '$lib/canvas/types'
  import type { Workflow, WorkflowDefinition } from '$lib/workflows/schema'
  import { isDatabaseFlowDefinition } from '$lib/workflows/database/definition'
  import DatabaseGraph from '$lib/components/canvas/workflows/database/DatabaseGraph.svelte'
  import WorkflowGraph from '$lib/components/canvas/workflows/WorkflowGraph.svelte'
  import WorkflowResizeHandle from '$lib/components/canvas/workflows/WorkflowResizeHandle.svelte'

  type FrameHandlers = {
    pointerDown: (event: PointerEvent, workflowId: string) => void
    pointerMove: (event: PointerEvent, workflowId: string) => void
    pointerUp: (
      event: PointerEvent,
      workflowId: string,
      options?: { focusOnClick?: boolean }
    ) => void
    pointerCancel: (event: PointerEvent, workflowId: string) => void
    resizePointerDown: (event: PointerEvent, workflowId: string) => void
    resizePointerMove: (event: PointerEvent, workflowId: string) => void
    resizePointerUp: (event: PointerEvent, workflowId: string) => void
    resizePointerCancel: (event: PointerEvent, workflowId: string) => void
  }

  let {
    workflow,
    camera,
    focused,
    canModify,
    canDrag,
    interactive,
    handlers,
    onFocus,
    onMaximize,
    onDelete,
    onDefinitionChange
  } = $props<{
    workflow: Workflow
    camera: Camera
    focused: boolean
    canModify: boolean
    canDrag: boolean
    interactive: boolean
    handlers: FrameHandlers
    onFocus: (workflowId: string) => void
    onMaximize: (workflowId: string) => void
    onDelete: (workflowId: string) => void
    onDefinitionChange: (definition: WorkflowDefinition) => void | Promise<void>
  }>()

  const frameStyle = $derived(
    `left:${camera.x + workflow.x * camera.scale}px;` +
      `top:${camera.y + workflow.y * camera.scale}px;` +
      `width:${workflow.width * camera.scale}px;` +
      `height:${workflow.height * camera.scale}px;` +
      `transform:rotate(${workflow.rotation}deg);` +
      'transform-origin:center;touch-action:none'
  )

  const isDatabase = $derived(isDatabaseFlowDefinition(workflow.definition))
  const steps = $derived(
    workflow.definition.flowType === 'workflow' ? workflow.definition.steps : []
  )
  const tables = $derived(
    isDatabaseFlowDefinition(workflow.definition)
      ? workflow.definition.tables
      : []
  )
</script>

<div
  class={`glass-card group absolute flex overflow-hidden p-0 transition-shadow ${
    interactive || canDrag ? 'pointer-events-auto' : 'pointer-events-none'
  } ${focused ? 'ring-2 ring-primary/50' : ''}`}
  style={frameStyle}
  data-workflow-id={workflow.id}
  role="button"
  tabindex="0"
  title={interactive ? 'Focus workflow' : 'Drag workflow'}
  aria-label={`${interactive ? 'Focus' : 'Drag'} workflow ${workflow.title}`}
  onpointerdown={(event) => handlers.pointerDown(event, workflow.id)}
  onpointermove={(event) => handlers.pointerMove(event, workflow.id)}
  onpointerup={(event) =>
    handlers.pointerUp(event, workflow.id, { focusOnClick: interactive })}
  onpointercancel={(event) => handlers.pointerCancel(event, workflow.id)}
  ondblclick={() => onFocus(workflow.id)}
  onkeydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (!interactive) return
      event.preventDefault()
      onFocus(workflow.id)
    }
  }}
>
  <div class="flex min-h-0 w-full flex-col bg-card/90">
    <div
      class="flex h-10 shrink-0 items-center gap-2 border-b border-border/70 px-3"
    >
      {#if isDatabase}
        <Database class="size-4 shrink-0 text-primary" />
      {:else}
        <GitBranch class="size-4 shrink-0 text-primary" />
      {/if}
      <span
        class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
      >
        {workflow.title}
      </span>
      <span
        class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
      >
        {#if isDatabase}
          {tables.length} tables
        {:else}
          {steps.length} nodes
        {/if}
      </span>
      {#if interactive}
        <button
          type="button"
          class="hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-primary/10 hover:text-primary group-hover:flex"
          onclick={(event) => {
            event.stopPropagation()
            onMaximize(workflow.id)
          }}
          aria-label="Maximize workflow"
          title="Maximize workflow"
        >
          <Maximize2 class="size-3.5" />
        </button>
        {#if canModify}
          <button
            type="button"
            class="hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive group-hover:flex"
            onclick={(event) => {
              event.stopPropagation()
              onDelete(workflow.id)
            }}
            aria-label="Delete workflow"
            title="Delete workflow"
          >
            <Trash2 class="size-3.5" />
          </button>
        {/if}
      {/if}
    </div>

    <div class="min-h-0 flex-1">
      <div class={`h-full ${focused ? '' : 'pointer-events-none'}`}>
        {#if isDatabase}
          <DatabaseGraph
            {workflow}
            canEdit={interactive && canModify && focused}
            {onDefinitionChange}
          />
        {:else}
          <WorkflowGraph
            {workflow}
            canEdit={interactive && canModify && focused}
            {onDefinitionChange}
          />
        {/if}
      </div>
    </div>
  </div>

  {#if interactive && canModify}
    <WorkflowResizeHandle workflowId={workflow.id} {handlers} />
  {/if}
</div>
