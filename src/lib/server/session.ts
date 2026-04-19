import { createClient } from '@supabase/supabase-js'
import { env as privateEnv } from '$env/dynamic/private'
import { getUserAvatarUrl, getUserDisplayName } from '$lib/auth/user-profile'
import { getSupabaseAuthCookieName } from '$lib/auth/supabase-cookie'
import {
  getSupabaseAccessTokenFromCookieHeader
} from '$lib/server/supabase-auth-cookie'

export type RequestUser = {
  id: string
  email: string
  name: string
  image: string | null
}

function getBearerToken(authorizationHeader: string) {
  const [scheme, token] = authorizationHeader.split(/\s+/, 2)
  if (!scheme || !token) {
    return null
  }

  return scheme.toLowerCase() === 'bearer' ? token : null
}

export async function getRequestSession(
  request: Request
): Promise<RequestUser | null> {
  const supabaseUrl = privateEnv.SUPABASE_URL
  const supabaseSecretKey = privateEnv.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    return null
  }

  const authorizationHeader = request.headers.get('authorization') ?? ''
  const cookieHeader = request.headers.get('cookie') ?? ''
  const authCookieName = getSupabaseAuthCookieName(supabaseUrl)
  const accessToken =
    getBearerToken(authorizationHeader) ??
    getSupabaseAccessTokenFromCookieHeader(cookieHeader, authCookieName)

  if (!accessToken) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey)
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: getUserDisplayName(user),
    image: getUserAvatarUrl(user)
  }
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('request auth header parsing', () => {
    it('extracts bearer tokens', () => {
      expect(getBearerToken('Bearer access-token')).toBe('access-token')
    })

    it('returns null for non-bearer auth schemes', () => {
      expect(getBearerToken('Basic abc123')).toBeNull()
    })

    it('returns null for empty auth headers', () => {
      expect(getBearerToken('')).toBeNull()
    })
  })
}
