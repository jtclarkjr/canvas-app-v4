import type { AuthConfig } from '$lib/server/auth-config'
import type { RequestUser } from '$lib/server/session'
import type { ListCanvasesResponse } from '$lib/canvas/schema'

declare global {
  namespace App {
    interface Locals {
      user: RequestUser | null
    }
    interface PageData {
      authConfig: AuthConfig
      user: RequestUser | null
      canvasList: ListCanvasesResponse & { error: string | null }
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
