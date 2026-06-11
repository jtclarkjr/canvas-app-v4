<script lang="ts">
  import type {
    Camera,
    DrawFormatting,
    EditingText,
    Path,
    Point,
    TextElement,
    Tool
  } from '$lib/canvas/types'
  import { calculateTextBounds, getTextLineHeight, pathToSvgPath } from '$lib/canvas/drawing-utils'
  import { selectionRectFromPoints } from '$lib/canvas/element-mapping'

  type CanvasSceneElements = {
    paths: Path[]
    currentPath: Point[]
    textElements: TextElement[]
  }

  type CanvasSceneSelection = {
    selectedIds: Set<string>
    start: Point | null
    end: Point | null
  }

  type CanvasSceneHandlers = {
    pointerDown: (event: PointerEvent) => void
    pointerMove: (event: PointerEvent) => void
    pointerUp: (event: PointerEvent) => void
    doubleClick: (event: MouseEvent) => void
  }

  let {
    svgEl = $bindable(null),
    camera,
    canEdit,
    selectedTool,
    drawFormatting,
    editingText,
    elements,
    selection,
    handlers
  } = $props<{
    svgEl?: SVGSVGElement | null
    camera: Camera
    canEdit: boolean
    selectedTool: Tool
    drawFormatting: DrawFormatting
    editingText: EditingText | null
    elements: CanvasSceneElements
    selection: CanvasSceneSelection
    handlers: CanvasSceneHandlers
  }>()

  const pointerEvents = $derived(
    canEdit && ['select', 'pencil', 'eraser', 'text'].includes(selectedTool) ? 'auto' : 'none'
  )
</script>

<svg
  bind:this={svgEl}
  aria-label="Drawing canvas"
  class="absolute inset-0 h-full w-full select-none"
  role="img"
  onpointerdown={handlers.pointerDown}
  onpointermove={handlers.pointerMove}
  onpointerup={handlers.pointerUp}
  onpointercancel={handlers.pointerUp}
  onpointerleave={handlers.pointerUp}
  ondblclick={handlers.doubleClick}
  style={`pointer-events:${pointerEvents};user-select:none;-webkit-user-select:none;touch-action:none`}
>
  <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.scale})`}>
    {#each elements.paths as path (path.id)}
      <path
        d={pathToSvgPath(path.points)}
        fill="none"
        filter={selection.selectedIds.has(path.id)
          ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))'
          : undefined}
        stroke={path.color}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-opacity={path.opacity}
        stroke-width={path.width}
      />
    {/each}

    {#if elements.currentPath.length > 0}
      <path
        d={pathToSvgPath(elements.currentPath)}
        fill="none"
        stroke={drawFormatting.color}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-opacity={drawFormatting.isHighlighter ? drawFormatting.highlighterOpacity : 1}
        stroke-width={drawFormatting.width}
      />
    {/if}

    {#each elements.textElements as text (text.id)}
      {#if editingText?.id !== text.id}
        {@const bounds = calculateTextBounds(text)}
        <g>
          {#if selection.selectedIds.has(text.id)}
            <rect
              fill="rgba(59, 130, 246, 0.1)"
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              rx={2 / camera.scale}
              stroke="#3b82f6"
              stroke-width={1 / camera.scale}
            />
          {/if}
          <text
            class="select-none"
            dominant-baseline="hanging"
            fill={text.color}
            font-size={text.fontSize}
            font-style={text.isItalic ? 'italic' : 'normal'}
            font-weight={text.isBold ? 'bold' : 'normal'}
            style="pointer-events:none"
            text-decoration={text.isUnderline ? 'underline' : 'none'}
            x={text.x}
            y={text.y}
          >
            {#each text.text.split('\n') as line, lineIndex (lineIndex)}
              <tspan x={text.x} y={text.y + lineIndex * getTextLineHeight(text.fontSize)}>
                {line}
              </tspan>
            {/each}
          </text>
        </g>
      {/if}
    {/each}

    {#if selection.start && selection.end}
      {@const rect = selectionRectFromPoints(selection.start, selection.end)}
      <rect
        fill="rgba(59, 130, 246, 0.1)"
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        pointer-events="none"
        stroke="#3b82f6"
        stroke-dasharray={`${4 / camera.scale} ${2 / camera.scale}`}
        stroke-width={1 / camera.scale}
      />
    {/if}
  </g>
</svg>
