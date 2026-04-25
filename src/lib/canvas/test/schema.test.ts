import { describe, expect, it } from 'vite-plus/test'
import {
  createCanvasInputSchema,
  upsertElementInputSchema
} from '$lib/canvas/schema'

describe('canvas schema', () => {
  it('trims and validates canvas titles', () => {
    expect(createCanvasInputSchema.parse({ title: '  Sketch  ' }).title).toBe(
      'Sketch'
    )

    expect(() => createCanvasInputSchema.parse({ title: '' })).toThrow()
  })

  it('accepts canvas element payloads with optional ids and nullable data', () => {
    const input = upsertElementInputSchema.parse({
      canvasId: 'canvas-1',
      type: 'text',
      data: null,
      x: 10,
      y: 20
    })

    expect(input.canvasId).toBe('canvas-1')
    expect(input.id).toBeUndefined()
    expect(input.data).toBeNull()
  })
})
