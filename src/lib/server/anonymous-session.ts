import { createClient } from '@supabase/supabase-js'
import type { Cookies } from '@sveltejs/kit'
import { env as privateEnv } from '$env/dynamic/private'
import { internalServerError } from '$lib/server/api-error'
import {
  requestUserFromSupabaseUser,
  type RequestSession
} from '$lib/server/session'
import { setSupabaseSessionCookie } from '$lib/server/session-cookie'

export async function createAnonymousRequestSession(
  cookies: Cookies
): Promise<RequestSession> {
  const supabaseUrl = privateEnv.SUPABASE_URL
  const supabasePublishableKey = privateEnv.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw internalServerError('Supabase auth is not configured.', {
      code: 'missing_supabase_env'
    })
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey)
  const { data, error } = await supabase.auth.signInAnonymously()

  if (error || !data.session || !data.user) {
    throw internalServerError('Could not start a public canvas session.', {
      code: 'anonymous_session_failed',
      cause: error
    })
  }

  setSupabaseSessionCookie(cookies, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token
  })

  return {
    user: requestUserFromSupabaseUser(data.user)
  }
}
