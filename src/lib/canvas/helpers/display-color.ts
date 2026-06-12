const pureBlackValues = new Set(['#000', '#000000', 'black', 'rgb(0,0,0)', 'rgb(0 0 0)'])

export function resolveCanvasDisplayColor(color: string | null | undefined): string {
  const normalized = color?.trim()

  if (!normalized || pureBlackValues.has(normalized.toLowerCase())) {
    return 'var(--canvas-ink)'
  }

  return normalized
}
