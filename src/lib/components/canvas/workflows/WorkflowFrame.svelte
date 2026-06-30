<script lang="ts">
  import { Database, GitBranch, Maximize2, Trash2 } from 'lucide-svelte'
  import type { Camera } from '$lib/canvas/types'
  import type { Workflow, WorkflowDefinition } from '$lib/workflows/schema'
  import { isDatabaseFlowDefinition } from '$lib/workflows/database/definition'
  import DatabaseGraph from '$lib/components/canvas/workflows/database/DatabaseGraph.svelte'
  import WorkflowGraph from '$lib/components/canvas/workflows/WorkflowGraph.svelte'
  import WorkflowResizeHandle from '$lib/components/canvas/workflows/WorkflowResizeHandle.svelte'
  import WorkflowTitleEditor from '$lib/components/canvas/workflows/WorkflowTitleEditor.svelte'

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
    canActivate,
    interactive,
    handlers,
    onFocus,
    onMaximize,
    onDelete,
    onRename,
    onDefinitionChange
  } = $props<{
    workflow: Workflow
    camera: Camera
    focused: boolean
    canModify: boolean
    canDrag: boolean
    canActivate: boolean
    interactive: boolean
    handlers: FrameHandlers
    onFocus: (workflowId: string) => void
    onMaximize: (workflowId: string) => void
    onDelete: (workflowId: string) => void
    onRename: (workflowId: string, title: string) => void | Promise<void>
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

  function handlePointerDown(event: PointerEvent) {
    if (interactive || canDrag) {
      handlers.pointerDown(event, workflow.id)
      return
    }

    event.stopPropagation()
  }

  function handlePointerMove(event: PointerEvent) {
    if (interactive || canDrag) {
      handlers.pointerMove(event, workflow.id)
    }
  }

  function handlePointerUp(event: PointerEvent) {
    if (interactive || canDrag) {
      handlers.pointerUp(event, workflow.id)
    }
  }

  function handlePointerCancel(event: PointerEvent) {
    if (interactive || canDrag) {
      handlers.pointerCancel(event, workflow.id)
    }
  }

  function handleClick(event: MouseEvent) {
    if (!canActivate || interactive || canDrag) return
    event.stopPropagation()
    onFocus(workflow.id)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (!interactive && !canActivate) return

    event.preventDefault()
    onFocus(workflow.id)
  }
</script>

<div
  class={`glass-card group absolute flex overflow-hidden p-0 transition-shadow ${
    interactive || canDrag || canActivate
      ? 'pointer-events-auto'
      : 'pointer-events-none'
  } ${focused ? 'ring-2 ring-primary/50' : ''}`}
  style={frameStyle}
  data-workflow-id={workflow.id}
  role="button"
  tabindex="0"
  title={interactive || canActivate ? 'Focus workflow' : 'Drag workflow'}
  aria-label={`${interactive || canActivate ? 'Focus' : 'Drag'} workflow ${workflow.title}`}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  onclick={handleClick}
  ondblclick={() => onFocus(workflow.id)}
  onkeydown={handleKeydown}
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
      <WorkflowTitleEditor
        title={workflow.title}
        canModify={interactive && canModify}
        onSave={(title) => onRename(workflow.id, title)}
      />
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
            lockedLabel={canModify ? 'Not selected' : 'Read-only'}
            {onDefinitionChange}
          />
        {:else}
          <WorkflowGraph
            {workflow}
            canEdit={interactive && canModify && focused}
            lockedLabel={canModify ? 'Not selected' : 'Read-only'}
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
