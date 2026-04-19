<script lang="ts">
  import { MousePointer2 } from 'lucide-svelte'

  type CursorEventPayload = {
    position: { x: number; y: number }
    user: { id: string; name: string }
    color: string
    timestamp: number
  }

  let { cursors } = $props<{
    cursors: Record<string, CursorEventPayload>
  }>()

  function getInitials(name: string) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    }

    return name.slice(0, 2).toUpperCase()
  }

  function cursorEntries() {
    return Object.entries(cursors) as Array<[string, CursorEventPayload]>
  }
</script>

<div class="pointer-events-none absolute inset-0 z-50">
  <div class="absolute inset-0">
    {#each cursorEntries() as [id, cursor] (id)}
      <div
        class="absolute"
        style={`left:${cursor.position.x}px;top:${cursor.position.y}px;transform:translateX(-2px) translateY(-2px)`}
      >
        <div class="relative">
          <MousePointer2
            aria-label="User cursor"
            fill={cursor.color}
            size={24}
            stroke={cursor.color}
            strokeWidth={1.5}
          />

          <div
            class="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-lg"
            style={`background-color:${cursor.color}`}
          >
            {getInitials(cursor.user.name)}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
