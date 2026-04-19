import type { AuthConfig } from '$lib/server/auth-config'
import type { RequestUser } from '$lib/server/session'

declare global {
  namespace App {
    interface Locals {
      user: RequestUser | null
    }
    interface PageData {
      authConfig: AuthConfig
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
