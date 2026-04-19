import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    return {
      canvasId: params.canvasId
    }
  }

  return {
    canvasId: params.canvasId,
    userId: locals.user.id,
    userEmail: locals.user.email
  }
}
