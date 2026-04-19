import { getAuthConfig } from '$lib/server/auth-config'

export function load() {
  return {
    authConfig: getAuthConfig()
  }
}
