import { ApiClientError, getApiHeaders, parseResponse } from '$lib/api-client'
import {
  accessRequestResponseSchema,
  createCanvasInputSchema,
  createCanvasResponseSchema,
  deleteCanvasResponseSchema,
  getCanvasResponseSchema,
  listCanvasesResponseSchema,
  myAccessRequestResponseSchema,
  type AccessRequestResponse,
  type CreateCanvasInput,
  type CreateCanvasResponse,
  type DeleteCanvasResponse,
  type GetCanvasResponse,
  type ListCanvasesResponse,
  type MemberRole,
  type MyAccessRequestResponse
} from '$lib/canvas/schema'
export { ApiClientError }

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

export async function deleteCanvas(id: string): Promise<DeleteCanvasResponse> {
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

export async function getCanvas(canvasId: string): Promise<GetCanvasResponse> {
  const response = await fetch(`/api/canvases/${canvasId}`, {
    headers: await getApiHeaders({ accept: 'application/json' })
  })

  return parseResponse(
    response,
    (payload) => getCanvasResponseSchema.parse(payload),
    'Failed to load canvas.'
  )
}

export async function requestAccess(
  canvasId: string,
  requestedRole?: MemberRole
): Promise<AccessRequestResponse> {
  const response = await fetch(`/api/canvases/${canvasId}/access-requests`, {
    method: 'POST',
    headers: await getApiHeaders({
      accept: 'application/json',
      ...(requestedRole ? { 'content-type': 'application/json' } : {})
    }),
    ...(requestedRole ? { body: JSON.stringify({ requestedRole }) } : {})
  })

  return parseResponse(
    response,
    (payload) => accessRequestResponseSchema.parse(payload),
    'Failed to request access.'
  )
}

export async function getMyAccessRequest(
  canvasId: string
): Promise<MyAccessRequestResponse> {
  const response = await fetch(`/api/canvases/${canvasId}/access-requests/me`, {
    headers: await getApiHeaders({ accept: 'application/json' })
  })

  return parseResponse(
    response,
    (payload) => myAccessRequestResponseSchema.parse(payload),
    'Failed to load access request.'
  )
}
