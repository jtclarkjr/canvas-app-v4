<script lang="ts">
  import {
    Bot,
    Check,
    ClipboardList,
    Database,
    Loader2,
    MessageSquare,
    Minus
  } from 'lucide-svelte'
  import { defaultModelId, modelOptions } from '$lib/scenes/models'
  import type { Scene, SceneDocumentListItem } from '$lib/scenes/schema'
  import type { SceneDocumentsStore } from '$lib/stores/scenes/documents.svelte'
  import { requestWorkflowAssistant } from '$lib/workflows/api'
  import { isDatabaseFlowDefinition } from '$lib/workflows/database/definition'
  import { getWorkflowFlowTypeDefinition } from '$lib/workflows/flow-types'
  import WorkflowDraggablePanel from '$lib/components/canvas/workflows/panels/WorkflowDraggablePanel.svelte'
  import type {
    UpdateWorkflowInput,
    Workflow,
    WorkflowContextSettings,
    WorkflowProposal,
    WorkflowSettings
  } from '$lib/workflows/schema'

  type ChatEntry = {
    id: string
    role: 'user' | 'assistant'
    text: string
    proposal?: WorkflowProposal | null
  }

  let {
    canvasId,
    workflow,
    scenes,
    sceneDocumentsStore,
    canModify,
    fullscreen = false,
    onPatchWorkflow,
    onPatchSettings
  } = $props<{
    canvasId: string
    workflow: Workflow
    scenes: Scene[]
    sceneDocumentsStore: SceneDocumentsStore
    canModify: boolean
    fullscreen?: boolean
    onPatchWorkflow: (patch: UpdateWorkflowInput) => Promise<Workflow | null>
    onPatchSettings: (settings: WorkflowSettings) => Promise<Workflow | null>
  }>()

  let prompt = $state('')
  let modelId = $state(defaultModelId)
  let isAsking = $state(false)
  let error = $state<string | null>(null)
  let messages = $state<ChatEntry[]>([])
  let lastWorkflowId = $state('')

  const context = $derived(workflow.settings.context)
  const isDatabaseFlow = $derived(isDatabaseFlowDefinition(workflow.definition))
  const flowTypeDefinition = $derived(
    getWorkflowFlowTypeDefinition(workflow.definition.flowType)
  )
  const flowLabel = $derived(flowTypeDefinition.label)
  const aiPromptPlaceholder = $derived(
    flowTypeDefinition.assistant.promptPlaceholder
  )
  const aiPromptSubject = $derived(flowTypeDefinition.assistant.promptSubject)
  const savedDocuments = $derived.by(() =>
    scenes.flatMap((scene: Scene) =>
      sceneDocumentsStore
        .getItems(scene.id)
        .filter(
          (document: SceneDocumentListItem) => document.status === 'saved'
        )
        .map((document: SceneDocumentListItem) => ({
          ...document,
          sceneTitle: scene.title
        }))
    )
  )

  $effect(() => {
    if (workflow.id !== lastWorkflowId) {
      messages = []
      lastWorkflowId = workflow.id
    }
  })

  function updateContext(next: WorkflowContextSettings) {
    void onPatchSettings({
      ...workflow.settings,
      context: next
    })
  }

  function toggleDocument(documentId: string) {
    if (!canModify) return
    const documentIds = context.documentIds.includes(documentId)
      ? context.documentIds.filter((id: string) => id !== documentId)
      : [...context.documentIds, documentId]
    updateContext({ ...context, documentIds })
  }

  function toggleScene(sceneId: string) {
    if (!canModify) return
    const sceneIds = context.sceneIds.includes(sceneId)
      ? context.sceneIds.filter((id: string) => id !== sceneId)
      : [...context.sceneIds, sceneId]
    updateContext({ ...context, sceneIds })
  }

  async function askAssistant() {
    if (!prompt.trim() || isAsking) return
    const text = prompt.trim()
    prompt = ''
    error = null
    isAsking = true
    messages = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text
      }
    ]

    try {
      const response = await requestWorkflowAssistant({
        canvasId,
        workflowId: workflow.id,
        modelId,
        prompt: text,
        workflow,
        context
      })
      messages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.message,
          proposal: response.proposal
        }
      ]
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : 'Failed to ask workflow AI.'
    } finally {
      isAsking = false
    }
  }

  async function applyProposal(proposal: WorkflowProposal) {
    error = null
    try {
      await onPatchWorkflow({
        definition: proposal.definition,
        configYaml: proposal.configYaml
      })
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : 'Failed to apply proposal.'
    }
  }
</script>

<WorkflowDraggablePanel
  side="left"
  panelWidth={300}
  {fullscreen}
  ariaLabel="Workflow AI builder"
  openLabel={`${flowLabel} AI`}
>
  {#snippet launcher()}
    {#if isDatabaseFlow}
      <Database class="size-4 shrink-0 text-primary" />
    {:else}
      <Bot class="size-4 shrink-0 text-primary" />
    {/if}
  {/snippet}

  {#snippet header({ minimize, animating })}
    <div class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
      {#if isDatabaseFlow}
        <Database class="size-4 text-primary" />
      {:else}
        <Bot class="size-4 text-primary" />
      {/if}
      <span class="min-w-0 flex-1 truncate text-sm font-semibold">
        {flowLabel} AI
      </span>
    </div>
    <button
      type="button"
      class="mr-3 flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
      onclick={() => void minimize()}
      disabled={animating}
      aria-label="Minimize workflow AI panel"
      title="Minimize workflow AI panel"
    >
      <Minus class="size-4" aria-hidden="true" />
    </button>
  {/snippet}

  <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
    <label class="grid gap-1 text-xs font-medium text-muted-foreground">
      Model
      <select
        bind:value={modelId}
        class="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
      >
        {#each modelOptions as model (model.id)}
          <option value={model.id}>{model.label}</option>
        {/each}
      </select>
    </label>

    <section class="grid gap-2">
      <div
        class="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
      >
        <ClipboardList class="size-3.5" />
        Context
      </div>
      <label class="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={context.includeLinkedScenes}
          disabled={!canModify}
          onchange={(event) =>
            updateContext({
              ...context,
              includeLinkedScenes: event.currentTarget.checked
            })}
        />
        Include linked scenes
      </label>
      <div
        class="grid max-h-28 gap-1 overflow-auto rounded-md border border-border/70 p-2"
      >
        {#each scenes as scene (scene.id)}
          <label class="flex min-w-0 items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={context.sceneIds.includes(scene.id)}
              disabled={!canModify}
              onchange={() => toggleScene(scene.id)}
            />
            <span class="min-w-0 truncate">{scene.title || 'Scene'}</span>
          </label>
        {:else}
          <p class="text-xs text-muted-foreground">No scenes available.</p>
        {/each}
      </div>
      <div
        class="grid max-h-32 gap-1 overflow-auto rounded-md border border-border/70 p-2"
      >
        {#each savedDocuments as document (document.id)}
          <label class="flex min-w-0 items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={context.documentIds.includes(document.id)}
              disabled={!canModify}
              onchange={() => toggleDocument(document.id)}
            />
            <span class="min-w-0 flex-1 truncate">
              {document.title || 'Untitled'}
            </span>
          </label>
        {:else}
          <p class="text-xs text-muted-foreground">No saved documents.</p>
        {/each}
      </div>
    </section>

    {#if error}
      <div
        class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        role="alert"
      >
        {error}
      </div>
    {/if}

    <div
      class="flex min-h-[120px] flex-1 flex-col gap-2 overflow-auto rounded-md border border-border/70 bg-background/60 p-2"
    >
      {#each messages as message (message.id)}
        <div
          class={`rounded-md px-2 py-1.5 text-xs ${
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          <p class="whitespace-pre-wrap">{message.text}</p>
          {#if message.proposal}
            <button
              type="button"
              class="mt-2 flex h-7 items-center gap-1.5 rounded bg-background px-2 text-xs font-medium text-foreground hover:bg-background/80"
              onclick={() =>
                applyProposal(message.proposal as WorkflowProposal)}
              disabled={!canModify}
            >
              <Check class="size-3.5" />
              Apply proposal
            </button>
          {/if}
        </div>
      {:else}
        <div
          class="flex h-full items-center justify-center text-xs text-muted-foreground"
        >
          <MessageSquare class="mr-2 size-4" />
          Ask for a {aiPromptSubject} proposal.
        </div>
      {/each}
    </div>

    <textarea
      bind:value={prompt}
      class="min-h-20 resize-none rounded-md border border-input bg-background p-2 text-sm text-foreground"
      placeholder={aiPromptPlaceholder}
      aria-label={`Describe the ${aiPromptSubject} to build`}
      disabled={!canModify || isAsking}
    ></textarea>
    <button
      type="button"
      class="flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      onclick={askAssistant}
      disabled={!canModify || isAsking || !prompt.trim()}
    >
      {#if isAsking}
        <Loader2 class="size-4 animate-spin" />
      {:else}
        <Bot class="size-4" />
      {/if}
      Ask
    </button>
  </div>
</WorkflowDraggablePanel>
