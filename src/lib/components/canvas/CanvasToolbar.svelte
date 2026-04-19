<script lang="ts">
  import { Eraser, Hand, MousePointer2, Pencil, Type } from 'lucide-svelte'
  import type { Tool } from '$lib/canvas/types'

  let { selectedTool, onToolChange } = $props<{
    selectedTool: Tool
    onToolChange: (tool: Tool) => void
  }>()

  let isExpanded = $state(false)

  const tools = [
    { id: 'select' as Tool, icon: MousePointer2, label: 'Pointer' },
    { id: 'hand' as Tool, icon: Hand, label: 'Hand' },
    { id: 'pencil' as Tool, icon: Pencil, label: 'Pencil' },
    { id: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
    { id: 'text' as Tool, icon: Type, label: 'Text' }
  ]

  function currentTool() {
    return tools.find((tool) => tool.id === selectedTool) ?? tools[0]
  }

  const CurrentIcon = $derived(currentTool().icon)
</script>

<div class="relative w-10">
  <button
    type="button"
    class="toolbar-pill flex h-10 w-10 items-center justify-center transition hover:border-slate-700 hover:bg-slate-900"
    onclick={() => (isExpanded = !isExpanded)}
    title="Tools"
  >
    <CurrentIcon class="size-5" />
  </button>

  <div
    class={`absolute left-0 top-12 overflow-hidden rounded-2xl border border-slate-800/80 bg-black/60 shadow-lg shadow-black/40 backdrop-blur transition-all duration-300 ease-out ${
      isExpanded ? 'max-h-96 w-10 opacity-100' : 'pointer-events-none max-h-0 w-10 opacity-0'
    }`}
    style="transform-origin: top center"
  >
    <div class="flex flex-col gap-1 p-1">
      {#each tools as tool}
        <button
          type="button"
          class={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            selectedTool === tool.id
              ? 'bg-primary text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          onclick={() => {
            onToolChange(tool.id)
            isExpanded = false
          }}
          title={tool.label}
        >
          <tool.icon class="size-4" />
        </button>
      {/each}
    </div>
  </div>
</div>
