import { describe, expect, it } from 'vite-plus/test'
import {
  accessRequestSchema,
  canvasRowSchema,
  canvasSchema,
  createCanvasInputSchema,
  requestAccessInputSchema,
  updateCanvasInputSchema,
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

  it('defaults canvas visibility to private when the column is absent', () => {
    const row = canvasRowSchema.parse({
      id: 'canvas-1',
      title: 'Sketch',
      created_by: 'user-1',
      created_at: '2026-06-12T00:00:00Z'
    })
    expect(row.visibility).toBe('private')

    const canvas = canvasSchema.parse({
      id: 'canvas-1',
      title: 'Sketch',
      createdBy: 'user-1',
      createdAt: '2026-06-12T00:00:00Z'
    })
    expect(canvas.visibility).toBe('private')
  })

  it('accepts visibility updates and rejects unknown values', () => {
    expect(updateCanvasInputSchema.parse({ visibility: 'public' }).visibility).toBe('public')
    expect(() => updateCanvasInputSchema.parse({ visibility: 'unlisted' })).toThrow()
  })

  it('accepts access requests with and without a requested role', () => {
    expect(requestAccessInputSchema.parse({}).requestedRole).toBeUndefined()
    expect(requestAccessInputSchema.parse({ requestedRole: 'editor' }).requestedRole).toBe(
      'editor'
    )
    expect(() => requestAccessInputSchema.parse({ requestedRole: 'owner' })).toThrow()
  })

  it('tolerates missing or null requestedRole on access request rows', () => {
    const base = {
      id: 'request-1',
      canvasId: 'canvas-1',
      status: 'pending',
      createdAt: '2026-06-12T00:00:00Z'
    }

    expect(accessRequestSchema.parse(base).requestedRole).toBeUndefined()
    expect(
      accessRequestSchema.parse({ ...base, requestedRole: null }).requestedRole
    ).toBeNull()
    expect(
      accessRequestSchema.parse({ ...base, requestedRole: 'editor' }).requestedRole
    ).toBe('editor')
  })
})
