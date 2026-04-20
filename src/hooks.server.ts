import { redirect, type Handle } from '@sveltejs/kit'
import { getRequestSession } from '$lib/server/session'
import { getSupabaseAuthCookieName } from '$lib/auth/supabase-cookie'
import { env as privateEnv } from '$env/dynamic/private'

export const handle: Handle = async ({ event, resolve }) => {
  const result = await getRequestSession(event.request)
  event.locals.user = result?.user ?? null

  if (result?.refreshedTokens) {
    const cookieName = getSupabaseAuthCookieName(privateEnv.SUPABASE_URL ?? '')
    if (cookieName) {
      const { accessToken, refreshToken } = result.refreshedTokens
      event.cookies.set(
        cookieName,
        encodeURIComponent(JSON.stringify([accessToken, refreshToken])),
        { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false }
      )
    }
  }

  if (event.url.pathname.startsWith('/canvas/') && !event.locals.user) {
    const redirectTo = `${event.url.pathname}${event.url.search}`
    throw redirect(303, `/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  return resolve(event)
}
