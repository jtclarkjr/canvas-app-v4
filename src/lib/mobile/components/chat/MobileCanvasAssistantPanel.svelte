<script lang="ts">
  import { useCanvasChatStore } from '$lib/stores/chat/canvas-chat.svelte'
  import MobileCanvasAssistantThread from '$lib/mobile/components/chat/MobileCanvasAssistantThread.svelte'

  let { canvasId } = $props<{ canvasId: string }>()

  const store = useCanvasChatStore()
</script>

{#if store.assistantInitialMessages !== null}
  {#key canvasId}
    <MobileCanvasAssistantThread
      {canvasId}
      initialMessages={store.assistantInitialMessages}
    />
  {/key}
{:else if store.assistantLoadError}
  <div
    class="flex h-full items-center justify-center px-6 text-center text-sm text-destructive"
    role="alert"
  >
    {store.assistantLoadError}
  </div>
{:else}
  <div
    class="flex h-full flex-col justify-end gap-3 px-4 py-4"
    aria-hidden="true"
  >
    <div class="h-10 w-3/5 animate-pulse rounded-2xl bg-muted/80"></div>
    <div class="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-muted/60"></div>
    <div class="h-10 w-4/5 animate-pulse rounded-2xl bg-muted/80"></div>
  </div>
{/if}
