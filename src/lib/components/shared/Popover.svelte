<script lang="ts">
  import { onMount } from 'svelte'
  import { cn } from '$lib/utils'

  type PopoverRenderProps = {
    id: string
    expanded: boolean
  }

  let {
    open = $bindable(false),
    id,
    label = 'Options',
    role = 'dialog',
    align = 'center',
    side = 'bottom',
    trigger,
    children
  } = $props<{
    open?: boolean
    id: string
    label?: string
    role?: 'dialog' | 'menu'
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'bottom'
    trigger?: (props: PopoverRenderProps) => unknown
    children?: () => unknown
  }>()

  let root = $state<HTMLDivElement | null>(null)
  let panelEl = $state<HTMLDivElement | null>(null)
  let panelVisible = $state(false)
  let activeAnim: Animation | null = null

  const alignOriginMap: Record<string, string> = {
    start: 'left',
    end: 'right',
    center: 'center'
  }
  const transformOrigin = $derived(
    `${side === 'bottom' ? 'top' : 'bottom'} ${alignOriginMap[align] ?? 'center'}`
  )

  $effect(() => {
    const isOpen = open
    if (isOpen) {
      panelVisible = true
      queueMicrotask(() => {
        if (!panelEl) return
        activeAnim?.cancel()
        panelEl.style.transformOrigin = transformOrigin
        activeAnim = panelEl.animate(
          [
            { transform: 'scale(0.85)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
          ],
          { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        )
      })
    } else {
      if (!panelVisible) return
      const el = panelEl
      if (!el) {
        panelVisible = false
        return
      }
      activeAnim?.cancel()
      el.style.transformOrigin = transformOrigin
      activeAnim = el.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.85)', opacity: 0 }
        ],
        {
          duration: 150,
          easing: 'cubic-bezier(0.55, 0, 0.55, 0.2)',
          fill: 'forwards'
        }
      )
      activeAnim.finished
        .then(() => {
          panelVisible = false
        })
        .catch(() => undefined)
    }
  })

  function focusTrigger() {
    root
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ?.focus()
  }

  function closePopover(restoreFocus = false) {
    open = false
    if (restoreFocus) {
      queueMicrotask(focusTrigger)
    }
  }

  onMount(() => {
    // pointerdown instead of mousedown: the canvas calls preventDefault() on
    // pointerdown, which suppresses the derived mouse events — clicks on the
    // drawing surface would never reach a mousedown listener.
    const handlePointerDown = (event: PointerEvent) => {
      if (!open || !root) {
        return
      }

      if (!root.contains(event.target as Node)) {
        closePopover()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        closePopover(true)
      }
    }

    // capture:true so canvas stopPropagation() on pointerdown can't block dismissal
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleEscape)
    }
  })
</script>

<div bind:this={root} class="relative">
  <div>
    {@render trigger?.({ id, expanded: open })}
  </div>

  {#if panelVisible}
    <div
      bind:this={panelEl}
      {id}
      {role}
      aria-label={label}
      class={cn(
        'popover-shell absolute z-30 min-w-[260px]',
        side === 'bottom' && 'top-full mt-2',
        side === 'top' && 'bottom-full mb-2',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'end' && 'right-0'
      )}
    >
      {@render children?.()}
    </div>
  {/if}
</div>
