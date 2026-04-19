import { z } from 'zod'

export const createCanvasInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give the canvas a title.')
    .max(100, 'Keep titles under 100 characters.')
})

export const updateCanvasInputSchema = z.object({
  title: createCanvasInputSchema.shape.title.optional()
})

export const canvasSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdBy: z.string(),
  createdAt: z.string()
})

export const listCanvasesResponseSchema = z.object({
  items: z.array(canvasSchema)
})

export const createCanvasResponseSchema = z.object({
  item: canvasSchema
})

export const updateCanvasResponseSchema = z.object({
  item: canvasSchema
})

export const deleteCanvasResponseSchema = z.object({
  item: canvasSchema
})

export const upsertElementInputSchema = z.object({
  id: z.string().optional(),
  canvasId: z.string(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  x: z.number(),
  y: z.number(),
  z: z.number().nullable().optional()
})

export const canvasElementSchema = z.object({
  id: z.string(),
  canvasId: z.string(),
  type: z.string(),
  data: z.unknown().nullable(),
  x: z.number(),
  y: z.number(),
  z: z.number().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  updatedAt: z.string().optional()
})

export const listElementsResponseSchema = z.object({
  items: z.array(canvasElementSchema)
})

export const upsertElementResponseSchema = z.object({
  item: canvasElementSchema
})

export const deleteElementResponseSchema = z.object({
  item: canvasElementSchema
})

export type CreateCanvasInput = z.infer<typeof createCanvasInputSchema>
export type UpdateCanvasInput = z.infer<typeof updateCanvasInputSchema>
export type Canvas = z.infer<typeof canvasSchema>
export type ListCanvasesResponse = z.infer<typeof listCanvasesResponseSchema>
export type CreateCanvasResponse = z.infer<typeof createCanvasResponseSchema>
export type UpdateCanvasResponse = z.infer<typeof updateCanvasResponseSchema>
export type DeleteCanvasResponse = z.infer<typeof deleteCanvasResponseSchema>
export type UpsertElementInput = z.infer<typeof upsertElementInputSchema>
export type CanvasElement = z.infer<typeof canvasElementSchema>
export type ListElementsResponse = z.infer<typeof listElementsResponseSchema>
export type UpsertElementResponse = z.infer<typeof upsertElementResponseSchema>
export type DeleteElementResponse = z.infer<typeof deleteElementResponseSchema>
