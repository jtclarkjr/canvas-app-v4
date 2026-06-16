<script lang="ts">
  import { MessageSquare, Mic, MicOff, Pin, Users, X } from 'lucide-svelte'
  import { useCanvasChatStore } from '$lib/stores/chat/canvas-chat.svelte'
  import { useCanvasConferenceStore } from '$lib/stores/conference/index.svelte'
  import CanvasChatRoomPanel from '$lib/components/canvas/chat/CanvasChatRoomPanel.svelte'
  import ConferenceCallChatPanel from '$lib/components/canvas/conference/ConferenceCallChatPanel.svelte'

  const store = useCanvasConferenceStore()
  const chatStore = useCanvasChatStore()

  let dragPointerId: number | null = null
  let dragStartY = 0
  let dragY = $state(0)
  let dragging = $state(false)

  const title = $derived(
    store.fullscreenPanel === 'chat'
      ? 'Chat'
      : `People · ${store.participants.length}`
  )
  const sheetStyle = $derived(`transform:translateY(${dragY}px)`)

  const chatTabClass = (active: boolean) =>
    `relative flex h-9 flex-1 items-center justify-center rounded-full px-3 text-xs font-bold transition ${
      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
    }`

  function closePanel() {
    if (store.fullscreenPanel === 'chat') {
      store.toggleFullscreenPanel('chat')
    } else if (store.fullscreenPanel === 'people') {
      store.toggleFullscreenPanel('people')
    }
  }

  function handleDragStart(event: PointerEvent) {
    dragPointerId = event.pointerId
    dragStartY = event.clientY - dragY
    dragging = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function handleDragMove(event: PointerEvent) {
    if (!dragging || event.pointerId !== dragPointerId) return
    dragY = Math.max(0, event.clientY - dragStartY)
  }

  function handleDragEnd(event: PointerEvent) {
    if (!dragging || event.pointerId !== dragPointerId) return
    dragging = false
    dragPointerId = null

    if (dragY > 80) {
      dragY = 0
      closePanel()
      return
    }

    dragY = 0
  }
</script>

<div class="fixed inset-0 z-30" data-camera-exempt>
  <button
    type="button"
    class="absolute inset-0 bg-black/30"
    onclick={closePanel}
    aria-label="Close call panel"
  ></button>

  <div
    class={`absolute inset-x-0 bottom-0 z-10 flex max-h-[78dvh] min-h-[20rem] flex-col overflow-hidden rounded-t-2xl border border-border/70 bg-card text-card-foreground shadow-2xl ${
      dragging ? '' : 'transition-transform duration-150'
    }`}
    style={sheetStyle}
    role="dialog"
    aria-label={title}
  >
    <header class="shrink-0 border-b border-border/60 px-4 pb-3 pt-2">
      <button
        type="button"
        class="mx-auto mb-3 block h-5 w-16 touch-none rounded-full"
        onpointerdown={handleDragStart}
        onpointermove={handleDragMove}
        onpointerup={handleDragEnd}
        onpointercancel={handleDragEnd}
        aria-label="Drag down to close panel"
      >
        <span class="mx-auto block h-1 w-10 rounded-full bg-muted-foreground/30"
        ></span>
      </button>
      <div class="flex items-center justify-between gap-3">
        <h2 class="flex min-w-0 items-center gap-2 text-sm font-bold">
          {#if store.fullscreenPanel === 'chat'}
            <MessageSquare class="size-4 shrink-0" aria-hidden="true" />
          {:else}
            <Users class="size-4 shrink-0" aria-hidden="true" />
          {/if}
          <span class="truncate">{title}</span>
        </h2>
        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onclick={closePanel}
          aria-label="Close panel"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>

    {#if store.fullscreenPanel === 'chat'}
      <div class="shrink-0 border-b border-border/60 px-3 py-2">
        <div class="flex rounded-full bg-muted/50 p-1">
          <button
            type="button"
            class={chatTabClass(store.fullscreenChatTab === 'call')}
            onclick={() => store.setFullscreenChatTab('call')}
            aria-pressed={store.fullscreenChatTab === 'call'}
          >
            Call
            {#if store.callChatUnreadCount > 0 && store.fullscreenChatTab !== 'call'}
              <span
                class="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground"
              >
                {store.callChatUnreadCount > 9
                  ? '9+'
                  : store.callChatUnreadCount}
              </span>
            {/if}
          </button>
          <button
            type="button"
            class={chatTabClass(store.fullscreenChatTab === 'canvas')}
            onclick={() => store.setFullscreenChatTab('canvas')}
            aria-pressed={store.fullscreenChatTab === 'canvas'}
          >
            Canvas
            {#if chatStore.unreadCount > 0 && store.fullscreenChatTab !== 'canvas'}
              <span
                class="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground"
              >
                {chatStore.unreadCount > 9 ? '9+' : chatStore.unreadCount}
              </span>
            {/if}
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1">
        {#if store.fullscreenChatTab === 'call'}
          <ConferenceCallChatPanel />
        {:else}
          <CanvasChatRoomPanel userId={store.userId} alwaysVisible />
        {/if}
      </div>
    {:else if store.fullscreenPanel === 'people'}
      <div class="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {#each store.participants as participant (participant.identity)}
          <div class="flex items-center gap-3 rounded-xl px-2 py-2">
            <span
              class={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-inner ${
                participant.isSpeaking ? 'ring-2 ring-success' : ''
              }`}
              style={`background-color:${participant.color};color:var(--canvas-avatar-foreground)`}
            >
              {participant.name.trim().slice(0, 2).toUpperCase() || 'ME'}
            </span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">
              {participant.isLocal ? 'You' : participant.name}
            </span>
            <button
              type="button"
              class={`flex size-8 items-center justify-center rounded-full transition ${
                store.pinnedIdentity === participant.identity
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground'
              }`}
              onclick={() => store.pin(participant.identity)}
              aria-label={`${store.pinnedIdentity === participant.identity ? 'Unpin' : 'Pin'} ${participant.isLocal ? 'yourself' : participant.name}`}
              aria-pressed={store.pinnedIdentity === participant.identity}
            >
              <Pin class="size-4" aria-hidden="true" />
            </button>
            <span
              class={participant.micEnabled
                ? 'text-muted-foreground'
                : 'text-destructive'}
              aria-label={participant.micEnabled
                ? 'Microphone on'
                : 'Microphone muted'}
            >
              {#if participant.micEnabled}
                <Mic class="size-4" aria-hidden="true" />
              {:else}
                <MicOff class="size-4" aria-hidden="true" />
              {/if}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
