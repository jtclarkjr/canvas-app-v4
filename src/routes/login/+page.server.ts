import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { sanitizeRedirectTarget } from '$lib/utils'

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    throw redirect(303, sanitizeRedirectTarget(url.searchParams.get('redirect')))
  }

  return {}
}
