import type { Handle } from '@sveltejs/kit'
import { getRequestSession } from '$lib/server/session'
import { setSupabaseSessionCookie } from '$lib/server/session-cookie'

export const handle: Handle = async ({ event, resolve }) => {
  const result = await getRequestSession(event.request)
  event.locals.user = result?.user ?? null

  if (result?.refreshedTokens) {
    setSupabaseSessionCookie(event.cookies, result.refreshedTokens)
  }

  return resolve(event)
}
