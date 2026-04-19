import { redirect, type Handle } from '@sveltejs/kit'
import { getRequestSession } from '$lib/server/session'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await getRequestSession(event.request)

  if (event.url.pathname.startsWith('/canvas/') && !event.locals.user) {
    const redirectTo = `${event.url.pathname}${event.url.search}`
    throw redirect(303, `/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  return resolve(event)
}
