<script lang="ts">
  import { Highlighter, Palette, Slash, Spline } from 'lucide-svelte'
  import type { DrawStyle } from '$lib/canvas/types'

  let {
    width,
    color,
    style,
    isHighlighter,
    highlighterOpacity,
    onWidthChange,
    onColorChange,
    onStyleChange,
    onHighlighterToggle,
    onHighlighterOpacityChange,
    isVisible
  } = $props<{
    width: number
    color: string
    style: DrawStyle
    isHighlighter: boolean
    highlighterOpacity: number
    onWidthChange: (width: number) => void
    onColorChange: (color: string) => void
    onStyleChange: (style: DrawStyle) => void
    onHighlighterToggle: () => void
    onHighlighterOpacityChange: (opacity: number) => void
    isVisible: boolean
  }>()

  function preventEditorBlur(event: MouseEvent) {
    event.preventDefault()
  }

  function handleWidthChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    const value = Number.parseInt(target.value, 10)
    if (!Number.isNaN(value)) {
      onWidthChange(Math.min(Math.max(value, 1), 24))
    }
  }

  function handleHighlighterOpacityChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    const value = Number.parseInt(target.value, 10)
    if (!Number.isNaN(value)) {
      onHighlighterOpacityChange(Math.min(Math.max(value, 10), 90) / 100)
    }
  }
</script>

{#if isVisible}
  <div
    class="pointer-events-auto fixed left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-800/80 bg-black/60 p-1 shadow-lg shadow-black/40 backdrop-blur"
    data-drawing-toolbar
  >
    <div class="flex items-center gap-2 rounded-lg bg-slate-900/40 px-3 py-1.5">
      <input
        class="h-1 w-24 cursor-pointer accent-primary"
        min="1"
        max="24"
        step="1"
        type="range"
        value={width}
        oninput={handleWidthChange}
        title="Stroke width"
      />
      <span class="w-6 text-center text-sm text-slate-200">{width}</span>
    </div>

    <div class="relative">
      <label
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white"
        for="draw-color"
        title="Stroke color"
      >
        <Palette class="size-4" />
      </label>
      <input
        id="draw-color"
        class="absolute inset-0 cursor-pointer opacity-0"
        type="color"
        value={color}
        oninput={(event) => onColorChange((event.currentTarget as HTMLInputElement).value)}
      />
    </div>

    <button
      type="button"
      class={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        style === 'freeform'
          ? 'bg-primary text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
      onmousedown={preventEditorBlur}
      onclick={() => onStyleChange('freeform')}
      title="Freeform"
    >
      <Spline class="size-4" />
    </button>
    <button
      type="button"
      class={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        style === 'straight'
          ? 'bg-primary text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
      onmousedown={preventEditorBlur}
      onclick={() => onStyleChange('straight')}
      title="Straight line"
    >
      <Slash class="size-4" />
    </button>

    <button
      type="button"
      class={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        isHighlighter
          ? 'bg-primary text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
      onmousedown={preventEditorBlur}
      onclick={onHighlighterToggle}
      title="Highlighter"
    >
      <Highlighter class="size-4" />
    </button>
    {#if isHighlighter}
      <div class="flex items-center gap-2 rounded-lg bg-slate-900/40 px-3 py-1.5">
        <input
          class="h-1 w-16 cursor-pointer accent-primary"
          min="10"
          max="90"
          step="5"
          type="range"
          value={Math.round(highlighterOpacity * 100)}
          oninput={handleHighlighterOpacityChange}
          title="Highlighter opacity"
        />
        <span class="w-9 text-center text-sm text-slate-200">
          {Math.round(highlighterOpacity * 100)}%
        </span>
      </div>
    {/if}
  </div>
{/if}
