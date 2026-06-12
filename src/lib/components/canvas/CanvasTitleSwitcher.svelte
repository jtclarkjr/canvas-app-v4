<script lang="ts">
  import { goto } from '$app/navigation'
  import { Home } from 'lucide-svelte'
  import { onMount } from 'svelte'
  import type { Canvas } from '$lib/canvas/schema'
  import type { Tool } from '$lib/canvas/types'
  import CanvasToolbar from '$lib/components/canvas/CanvasToolbar.svelte'

  let {
    canvases,
    activeCanvasId,
    currentTitle,
    canManageCanvas,
    isLoadingCanvases,
    selectedTool,
    readOnly,
    onToolChange,
    onTitleSave
  } = $props<{
    canvases: Canvas[]
    activeCanvasId: string
    currentTitle: string
    canManageCanvas: boolean
    isLoadingCanvases: boolean
    selectedTool: Tool
    readOnly: boolean
    onToolChange: (tool: Tool) => void
    onTitleSave: (title: string) => void | Promise<void>
  }>()

  let titleInputEl = $state<HTMLInputElement | null>(null)
  let dropdownEl = $state<HTMLDivElement | null>(null)
  let showCanvasSelector = $state(false)
  let isEditingTitle = $state(false)
  let editedTitle = $state('')

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownEl && event.target instanceof Node && !dropdownEl.contains(event.target)) {
        showCanvasSelector = false
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  })

  function beginTitleEdit() {
    if (!canManageCanvas) {
      return
    }

    editedTitle = currentTitle
    isEditingTitle = true
    queueMicrotask(() => {
      titleInputEl?.focus()
      titleInputEl?.select()
    })
  }

  async function saveTitle() {
    if (!editedTitle.trim()) {
      isEditingTitle = false
      return
    }

    await onTitleSave(editedTitle.trim())
    isEditingTitle = false
  }
</script>

<div class="fixed left-4 top-4 z-20 flex items-start gap-4">
  <div class="flex flex-col gap-2">
    <a
      href="/"
      class="toolbar-pill flex h-10 w-10 items-center justify-center"
      title="Back to dashboard"
    >
      <Home class="size-5" />
    </a>
    <CanvasToolbar {selectedTool} {readOnly} {onToolChange} />
  </div>

  <div class="flex items-start gap-2">
    {#if isEditingTitle}
      <div class="toolbar-pill flex items-center gap-1 px-3 py-1">
        <input
          bind:this={titleInputEl}
          class="w-[200px] border-0 bg-transparent text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground outline-none"
          bind:value={editedTitle}
          onblur={() => void saveTitle()}
          onkeydown={(event) => {
            if (event.key === 'Enter') {
              void saveTitle()
            } else if (event.key === 'Escape') {
              isEditingTitle = false
            }
          }}
        />
      </div>
    {:else if canManageCanvas}
      <button
        type="button"
        class="toolbar-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
        onclick={beginTitleEdit}
      >
        {currentTitle || 'Select Canvas'}
      </button>
    {:else}
      <span class="toolbar-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
        {currentTitle || 'Canvas'}
      </span>
    {/if}

    <div bind:this={dropdownEl} class="relative">
      <button
        type="button"
        class="toolbar-pill flex h-8 w-8 items-center justify-center"
        onclick={() => (showCanvasSelector = !showCanvasSelector)}
        title="Switch canvas"
      >
        ▾
      </button>
      {#if showCanvasSelector}
        <div
          class="absolute left-0 top-full mt-2 min-w-[200px] rounded-lg border border-border/70 bg-popover text-popover-foreground shadow-xl"
        >
          <div class="max-h-[300px] overflow-y-auto p-2">
            {#if canvases.length > 0}
              {#each canvases as canvas}
                <button
                  type="button"
                  class={`w-full rounded px-3 py-2 text-left text-sm font-medium transition ${
                    canvas.id === activeCanvasId
                      ? 'bg-primary text-primary-foreground'
                      : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onclick={() => {
                    showCanvasSelector = false
                    if (canvas.id !== activeCanvasId) {
                      void goto(`/canvas/${canvas.id}`)
                    }
                  }}
                >
                  {canvas.title}
                </button>
              {/each}
            {:else if isLoadingCanvases}
              <div class="px-3 py-2 text-sm text-muted-foreground">Loading canvases...</div>
            {:else}
              <div class="px-3 py-2 text-sm text-muted-foreground">No canvases yet</div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
