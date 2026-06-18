<script lang="ts">
  import {
    Background,
    BackgroundVariant,
    Controls,
    SvelteFlow,
    type Connection,
    type NodeTypes
  } from '@xyflow/svelte'
  import '@xyflow/svelte/dist/style.css'
  import { GitBranch, ListPlus, Plus, Split } from 'lucide-svelte'
  import MobileWorkflowNode from '$lib/mobile/components/workflows/MobileWorkflowNode.svelte'
  import { theme } from '$lib/stores/shared/theme.svelte'
  import {
    createWorkflowStep,
    workflowDefinitionFromFlow,
    workflowDefinitionToFlow
  } from '$lib/workflows/definition'
  import type {
    Workflow,
    WorkflowDefinition,
    WorkflowStepType
  } from '$lib/workflows/schema'
  import type { WorkflowFlowEdge, WorkflowFlowNode } from '$lib/workflows/types'

  let { workflow, canEdit, onDefinitionChange } = $props<{
    workflow: Workflow
    canEdit: boolean
    onDefinitionChange: (definition: WorkflowDefinition) => void | Promise<void>
  }>()

  let nodes = $state<WorkflowFlowNode[]>([])
  let edges = $state<WorkflowFlowEdge[]>([])
  let syncedKey = $state('')

  const nodeTypes: NodeTypes = {
    workflow: MobileWorkflowNode
  }

  $effect(() => {
    const nextKey = `${workflow.id}:${workflow.updatedAt}:${JSON.stringify(
      workflow.definition
    )}`
    if (nextKey === syncedKey) {
      return
    }

    const flow = workflowDefinitionToFlow(workflow.definition)
    nodes = flow.nodes
    edges = flow.edges
    syncedKey = nextKey
  })

  function emitDefinition(next: WorkflowDefinition) {
    void onDefinitionChange(next)
  }

  function commitFlow() {
    if (!canEdit) return
    emitDefinition(
      workflowDefinitionFromFlow(nodes, edges, workflow.definition)
    )
  }

  function handleConnect(connection: Connection) {
    if (!canEdit || !connection.source || !connection.target) return
    const id = `${connection.source}->${connection.target}`
    if (edges.some((edge) => edge.id === id)) return
    edges = [
      ...edges,
      {
        id,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'smoothstep',
        markerEnd: { type: 'arrowclosed' },
        data: {}
      }
    ]
    commitFlow()
  }

  function addStep(type: WorkflowStepType) {
    if (!canEdit) return
    emitDefinition({
      ...workflow.definition,
      steps: [
        ...workflow.definition.steps,
        createWorkflowStep(workflow.definition, type)
      ]
    })
  }

  function stopSheetGesture(event: Event) {
    event.stopPropagation()
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="mobile-workflow-graph relative h-full min-h-[320px] overflow-hidden bg-background/80"
  role="application"
  aria-label="Workflow graph editor"
  tabindex="-1"
  onpointerdown={stopSheetGesture}
  onpointermove={stopSheetGesture}
  onpointerup={stopSheetGesture}
  onkeydown={stopSheetGesture}
>
  {#if canEdit}
    <div
      class="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-border/80 bg-background/90 p-1 shadow-sm backdrop-blur"
    >
      <button
        type="button"
        class="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-foreground transition hover:bg-muted"
        onclick={() => addStep('task')}
      >
        <Plus class="size-3.5" aria-hidden="true" />
        Step
      </button>
      <button
        type="button"
        class="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-foreground transition hover:bg-muted"
        onclick={() => addStep('decision')}
      >
        <Split class="size-3.5" aria-hidden="true" />
        Decision
      </button>
      <button
        type="button"
        class="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-foreground transition hover:bg-muted"
        onclick={() => addStep('output')}
      >
        <ListPlus class="size-3.5" aria-hidden="true" />
        Output
      </button>
    </div>
  {/if}

  <SvelteFlow
    bind:nodes
    bind:edges
    fitView
    {nodeTypes}
    colorMode={theme.current}
    nodesDraggable={canEdit}
    nodesConnectable={canEdit}
    elementsSelectable={canEdit}
    deleteKey={canEdit ? ['Backspace', 'Delete'] : null}
    minZoom={0.2}
    maxZoom={1.8}
    defaultEdgeOptions={{
      type: 'smoothstep',
      markerEnd: { type: 'arrowclosed' as const }
    }}
    onconnect={handleConnect}
    onnodedragstop={commitFlow}
    ondelete={commitFlow}
    proOptions={{ hideAttribution: true }}
  >
    <Controls />
    <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
  </SvelteFlow>

  {#if nodes.length === 0}
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
    >
      <div class="flex items-center gap-2">
        <GitBranch class="size-4" aria-hidden="true" />
        Empty workflow
      </div>
    </div>
  {/if}
</div>
