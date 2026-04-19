import { ApiClientError, parseResponse } from '$lib/api-client'
import {
  createCanvasInputSchema,
  createCanvasResponseSchema,
  deleteCanvasResponseSchema,
  deleteElementResponseSchema,
  listCanvasesResponseSchema,
  listElementsResponseSchema,
  updateCanvasInputSchema,
  updateCanvasResponseSchema,
  upsertElementInputSchema,
  upsertElementResponseSchema,
  type CreateCanvasInput,
  type CreateCanvasResponse,
  type DeleteCanvasResponse,
  type DeleteElementResponse,
  type ListCanvasesResponse,
  type ListElementsResponse,
  type UpdateCanvasInput,
  type UpdateCanvasResponse,
  type UpsertElementInput,
  type UpsertElementResponse
} from '$lib/canvas/schema'
import { getAccessToken } from '$lib/auth/session-service'

export { ApiClientError }

async function getApiHeaders(headers: HeadersInit) {
  const nextHeaders = new Headers(headers)
  const accessToken = await getAccessToken()

  if (accessToken) {
    nextHeaders.set('authorization', `Bearer ${accessToken}`)
  }

  return nextHeaders
}

export async function listCanvases(): Promise<ListCanvasesResponse> {
  const response = await fetch('/api/canvases', {
    headers: await getApiHeaders({ accept: 'application/json' })
  })

  return parseResponse(
    response,
    (payload) => listCanvasesResponseSchema.parse(payload),
    'Failed to load canvases.'
  )
}

export async function createCanvas(
  input: CreateCanvasInput
): Promise<CreateCanvasResponse> {
  const payload = createCanvasInputSchema.parse(input)

  const response = await fetch('/api/canvases', {
    method: 'POST',
    headers: await getApiHeaders({
      accept: 'application/json',
      'content-type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })

  return parseResponse(
    response,
    (payload) => createCanvasResponseSchema.parse(payload),
    'Failed to create canvas.'
  )
}

export async function updateCanvas(
  id: string,
  input: UpdateCanvasInput
): Promise<UpdateCanvasResponse> {
  const payload = updateCanvasInputSchema.parse(input)

  const response = await fetch(`/api/canvases/${id}`, {
    method: 'PATCH',
    headers: await getApiHeaders({
      accept: 'application/json',
      'content-type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })

  return parseResponse(
    response,
    (payload) => updateCanvasResponseSchema.parse(payload),
    'Failed to update canvas.'
  )
}

export async function deleteCanvas(
  id: string
): Promise<DeleteCanvasResponse> {
  const response = await fetch(`/api/canvases/${id}`, {
    method: 'DELETE',
    headers: await getApiHeaders({ accept: 'application/json' })
  })

  return parseResponse(
    response,
    (payload) => deleteCanvasResponseSchema.parse(payload),
    'Failed to delete canvas.'
  )
}

export async function listElements(
  canvasId: string
): Promise<ListElementsResponse> {
  const response = await fetch(`/api/canvases/${canvasId}/elements`, {
    headers: await getApiHeaders({ accept: 'application/json' })
  })

  return parseResponse(
    response,
    (payload) => listElementsResponseSchema.parse(payload),
    'Failed to load canvas elements.'
  )
}

export async function upsertElement(
  input: UpsertElementInput
): Promise<UpsertElementResponse> {
  const payload = upsertElementInputSchema.parse(input)

  const response = await fetch(`/api/canvases/${payload.canvasId}/elements`, {
    method: 'POST',
    headers: await getApiHeaders({
      accept: 'application/json',
      'content-type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })

  return parseResponse(
    response,
    (payload) => upsertElementResponseSchema.parse(payload),
    'Failed to save canvas element.'
  )
}

export async function deleteElement(
  canvasId: string,
  elementId: string
): Promise<DeleteElementResponse> {
  const response = await fetch(
    `/api/canvases/${canvasId}/elements/${elementId}`,
    {
      method: 'DELETE',
      headers: await getApiHeaders({ accept: 'application/json' })
    }
  )

  return parseResponse(
    response,
    (payload) => deleteElementResponseSchema.parse(payload),
    'Failed to delete canvas element.'
  )
}
