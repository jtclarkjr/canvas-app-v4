<script lang="ts">
  import { fade } from 'svelte/transition'
  import { useCanvasChatStore } from '$lib/stores/chat/canvas-chat.svelte'
  import { useCanvasConferenceStore } from '$lib/stores/conference/index.svelte'
  import ConferenceTileGrid from './ConferenceTileGrid.svelte'
  import ConferenceFullscreenPanel from './ConferenceFullscreenPanel.svelte'
  import ConferenceControls from './ConferenceControls.svelte'

  const store = useCanvasConferenceStore()
  const chatStore = useCanvasChatStore()

  $effect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !store.settingsOpen) {
        store.setViewMode('pip')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  $effect(() => {
    if (store.fullscreenPanel === 'chat') {
      void chatStore.ensureLoaded()
    }
  })

  $effect(() => {
    void chatStore.entries.length
    if (store.fullscreenPanel === 'chat') {
      chatStore.markChatRead()
    }
  })
</script>

<div
  class="fixed inset-0 z-50 flex flex-col bg-background"
  transition:fade={{ duration: 150 }}
  role="dialog"
  aria-label="Call"
  data-camera-exempt
>
  <div class="flex min-h-0 flex-1">
    <ConferenceTileGrid />
    {#if store.fullscreenPanel !== 'none'}
      <ConferenceFullscreenPanel />
    {/if}
  </div>
  <ConferenceControls />
</div>
