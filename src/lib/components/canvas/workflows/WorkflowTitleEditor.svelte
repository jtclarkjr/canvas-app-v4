<script lang="ts">
  import { tick } from 'svelte'
  import { Pencil } from 'lucide-svelte'

  let {
    title,
    canModify,
    className = '',
    inputClassName = '',
    buttonClassName = '',
    onSave
  } = $props<{
    title: string
    canModify: boolean
    className?: string
    inputClassName?: string
    buttonClassName?: string
    onSave: (title: string) => void | Promise<void>
  }>()

  let editing = $state(false)
  let draft = $state('')
  let inputEl = $state<HTMLInputElement | null>(null)

  $effect(() => {
    if (!editing) {
      draft = title
    }
  })

  function stopEvent(event: Event) {
    event.stopPropagation()
  }

  async function startEditing(event: MouseEvent) {
    event.stopPropagation()
    draft = title
    editing = true
    await tick()
    inputEl?.focus()
    inputEl?.select()
  }

  function cancelEditing() {
    draft = title
    editing = false
  }

  async function commitTitle() {
    const nextTitle = draft.trim()
    editing = false
    if (!nextTitle || nextTitle === title) {
      draft = title
      return
    }
    await onSave(nextTitle)
  }

  function handleKeydown(event: KeyboardEvent) {
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      void commitTitle()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }
</script>

{#if editing}
  <input
    bind:this={inputEl}
    bind:value={draft}
    maxlength="120"
    class={`min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-semibold text-foreground outline-none focus:border-primary ${inputClassName}`}
    aria-label="Workflow title"
    onblur={() => void commitTitle()}
    onclick={stopEvent}
    onpointerdown={stopEvent}
    onkeydown={handleKeydown}
  />
{:else}
  <span
    class={`min-w-0 flex-1 truncate text-sm font-semibold text-foreground ${className}`}
  >
    {title}
  </span>
  {#if canModify}
    <button
      type="button"
      class={`hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-primary/10 hover:text-primary group-hover:flex focus:flex ${buttonClassName}`}
      onclick={startEditing}
      onpointerdown={stopEvent}
      aria-label="Rename workflow"
      title="Rename workflow"
    >
      <Pencil class="size-3.5" aria-hidden="true" />
    </button>
  {/if}
{/if}
