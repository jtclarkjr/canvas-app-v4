import { json, type RequestHandler } from '@sveltejs/kit'
import {
    canvasRowSchema,
    createCanvasInputSchema,
    createCanvasResponseSchema,
    listCanvasesResponseSchema
} from '$lib/canvas/schema'
import type { CanvasRow } from '$lib/canvas/schema'
import {
    handleApiError,
    parseInput,
    parseJsonBody,
    withAuth
} from '$lib/server/api-error'
import { withRateLimit } from '$lib/server/rate-limit'
import { getSupabase } from '$lib/server/supabase'

const toCanvas = (row: CanvasRow) => ({
    id: row.id,
    title: row.title,
    createdBy: row.created_by,
    createdAt: row.created_at
})

export const GET: RequestHandler = async (event) =>
    withRateLimit(async () => {
        try {
            const supabase = getSupabase()
            const user = withAuth(event.locals.user)

            const { data, error } = await supabase
                .from('canvases')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }

            return json(
                listCanvasesResponseSchema.parse({
                    items: (data ?? []).map((row) => toCanvas(canvasRowSchema.parse(row)))
                })
            )
        } catch (error) {
            return handleApiError(error, event.request)
        }
    })({ request: event.request })

export const POST: RequestHandler = async (event) =>
    withRateLimit(async () => {
        try {
            const supabase = getSupabase()
            const user = withAuth(event.locals.user)

            const payload = await parseJsonBody(event.request)
            const input = parseInput(createCanvasInputSchema, payload)

            const { data, error } = await supabase
                .from('canvases')
                .insert({ title: input.title, created_by: user.id })
                .select()
                .single()

            if (error || !data) {
                throw error ?? new Error('Failed to create canvas')
            }

            return json(
                createCanvasResponseSchema.parse({
                    item: toCanvas(canvasRowSchema.parse(data))
                }),
                { status: 201 }
            )
        } catch (error) {
            return handleApiError(error, event.request)
        }
    })({ request: event.request })
