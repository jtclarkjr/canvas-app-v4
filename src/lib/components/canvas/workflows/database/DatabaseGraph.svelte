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
  import { Database, Plus } from 'lucide-svelte'
  import DatabaseTableNode from '$lib/components/canvas/workflows/database/DatabaseTableNode.svelte'
  import {
    createDatabaseRelation,
    createDatabaseTable,
    databaseColumnHandleId,
    databaseDefinitionFromFlow,
    databaseDefinitionToFlow,
    isDatabaseFlowDefinition,
    parseDatabaseColumnHandleId
  } from '$lib/workflows/database/definition'
  import type {
    DatabaseFlowEdge,
    DatabaseFlowNode
  } from '$lib/workflows/database/types'
  import type { Workflow, WorkflowDefinition } from '$lib/workflows/schema'

  let { workflow, canEdit, onDefinitionChange } = $props<{
    workflow: Workflow
    canEdit: boolean
    onDefinitionChange: (definition: WorkflowDefinition) => void | Promise<void>
  }>()

  let nodes = $state<DatabaseFlowNode[]>([])
  let edges = $state<DatabaseFlowEdge[]>([])
  let syncedKey = $state('')
  let isConnecting = $state(false)

  const nodeTypes: NodeTypes = {
    databaseTable: DatabaseTableNode
  }

  $effect(() => {
    if (!isDatabaseFlowDefinition(workflow.definition)) {
      nodes = []
      edges = []
      return
    }

    const nextKey = `${workflow.id}:${workflow.updatedAt}:${JSON.stringify(
      workflow.definition
    )}`
    if (nextKey === syncedKey) {
      return
    }

    const flow = databaseDefinitionToFlow(workflow.definition)
    nodes = flow.nodes
    edges = flow.edges
    syncedKey = nextKey
  })

  function emitDefinition(next: WorkflowDefinition) {
    void onDefinitionChange(next)
  }

  function commitFlow() {
    if (!canEdit || !isDatabaseFlowDefinition(workflow.definition)) return
    emitDefinition(
      databaseDefinitionFromFlow(nodes, edges, workflow.definition)
    )
  }

  function handleConnect(connection: Connection) {
    if (
      !canEdit ||
      !isDatabaseFlowDefinition(workflow.definition) ||
      !connection.source ||
      !connection.target
    ) {
      return
    }

    const sourceColumnId = parseDatabaseColumnHandleId(
      'source',
      connection.sourceHandle
    )
    const targetColumnId = parseDatabaseColumnHandleId(
      'target',
      connection.targetHandle
    )
    if (!sourceColumnId || !targetColumnId) return

    const duplicate = edges.some(
      (edge) =>
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.data?.sourceColumnId === sourceColumnId &&
        edge.data?.targetColumnId === targetColumnId
    )
    if (duplicate) return

    const relation = createDatabaseRelation(
      workflow.definition,
      connection.source,
      sourceColumnId,
      connection.target,
      targetColumnId
    )
    edges = [
      ...edges,
      {
        id: relation.id,
        source: relation.sourceTableId,
        target: relation.targetTableId,
        sourceHandle: databaseColumnHandleId('source', sourceColumnId),
        targetHandle: databaseColumnHandleId('target', targetColumnId),
        type: 'smoothstep',
        markerEnd: { type: 'arrowclosed' },
        data: {
          relationId: relation.id,
          sourceColumnId: relation.sourceColumnId,
          targetColumnId: relation.targetColumnId,
          name: relation.name,
          onDelete: relation.onDelete
        }
      }
    ]
    commitFlow()
  }

  function handleConnectStart() {
    isConnecting = true
  }

  function handleConnectEnd() {
    isConnecting = false
  }

  function addTable() {
    if (!canEdit || !isDatabaseFlowDefinition(workflow.definition)) return
    emitDefinition({
      ...workflow.definition,
      tables: [
        ...workflow.definition.tables,
        createDatabaseTable(workflow.definition)
      ]
    })
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class={`database-graph relative h-full min-h-[260px] overflow-hidden bg-background/80 ${
    isConnecting ? 'is-connecting' : ''
  }`}
  role="application"
  aria-label="Database flow editor"
  tabindex="-1"
  onpointerdown={(event) => event.stopPropagation()}
  onpointermove={(event) => event.stopPropagation()}
  onpointerup={(event) => event.stopPropagation()}
  onkeydown={(event) => event.stopPropagation()}
>
  {#if canEdit}
    <div
      class="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-md border border-border/80 bg-background/90 p-1 shadow-sm backdrop-blur"
    >
      <button
        type="button"
        class="flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium text-foreground transition hover:bg-muted"
        onclick={addTable}
      >
        <Plus class="size-3.5" />
        Table
      </button>
    </div>
  {/if}

  <SvelteFlow
    bind:nodes
    bind:edges
    fitView
    {nodeTypes}
    nodesDraggable={canEdit}
    nodesConnectable={canEdit}
    elementsSelectable={canEdit}
    deleteKey={canEdit ? ['Backspace', 'Delete'] : null}
    minZoom={0.25}
    maxZoom={1.5}
    defaultEdgeOptions={{
      type: 'smoothstep',
      markerEnd: { type: 'arrowclosed' as const }
    }}
    onconnect={handleConnect}
    onconnectstart={handleConnectStart}
    onconnectend={handleConnectEnd}
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
        <Database class="size-4" />
        Empty database
      </div>
    </div>
  {/if}
</div>
