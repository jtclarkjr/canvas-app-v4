<script lang="ts">
  import { Panel, useStore } from '@xyflow/svelte'
  import { Lock, Unlock } from 'lucide-svelte'

  let { canEdit, lockedLabel = 'Read-only' } = $props<{
    canEdit: boolean
    lockedLabel?: string
  }>()

  let store = $derived(useStore())
  let isInteractive = $derived(
    store.nodesDraggable || store.nodesConnectable || store.elementsSelectable
  )
  let isUnlocked = $derived(canEdit && isInteractive)
  let statusLabel = $derived.by(() => {
    if (isUnlocked) return 'Unlocked'
    if (canEdit) return 'Locked'
    return 'Read-only'
  })
  let detailLabel = $derived.by(() => {
    if (isUnlocked) return 'Interactive'
    if (canEdit) return 'Interaction off'
    return lockedLabel
  })
  let buttonToneClass = $derived.by(() => {
    if (isUnlocked) {
      return 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
    }
    if (canEdit) {
      return 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300'
    }
    return 'border-border/70 bg-background/90 text-muted-foreground'
  })
  let iconToneClass = $derived(
    isUnlocked ? 'bg-primary text-primary-foreground' : 'bg-background/90'
  )

  function stopGraphControlEvent(event: Event) {
    event.stopPropagation()
  }

  function toggleInteractivity(event: MouseEvent) {
    stopGraphControlEvent(event)
    if (!canEdit) return

    const nextInteractive = !isInteractive
    store.nodesDraggable = nextInteractive
    store.nodesConnectable = nextInteractive
    store.elementsSelectable = nextInteractive
  }
</script>

<Panel position="top-right" class="!m-3">
  <button
    type="button"
    class={`nodrag nopan flex min-w-32 items-center gap-2 rounded-full border px-2.5 py-1.5 text-left shadow-sm backdrop-blur transition ${buttonToneClass}`}
    onclick={toggleInteractivity}
    onpointerdown={stopGraphControlEvent}
    aria-pressed={isUnlocked}
    aria-disabled={!canEdit}
    aria-label={`${statusLabel}: ${detailLabel}`}
    title={canEdit ? 'Toggle graph interactivity' : detailLabel}
  >
    <span
      class={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconToneClass}`}
    >
      {#if isUnlocked}
        <Unlock class="size-3.5" aria-hidden="true" />
      {:else}
        <Lock class="size-3.5" aria-hidden="true" />
      {/if}
    </span>
    <span class="min-w-0 leading-none">
      <span class="block text-xs font-semibold">{statusLabel}</span>
      <span class="mt-0.5 block text-[10px] opacity-80">{detailLabel}</span>
    </span>
  </button>
</Panel>
