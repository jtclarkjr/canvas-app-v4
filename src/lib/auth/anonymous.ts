export function isAnonymousUser(user: unknown) {
  if (!user || typeof user !== 'object') {
    return false
  }

  const record = user as {
    isAnonymous?: unknown
    is_anonymous?: unknown
  }
  return record.isAnonymous === true || record.is_anonymous === true
}

export function isAccountUser(user: unknown) {
  return Boolean(user) && !isAnonymousUser(user)
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('anonymous user helpers', () => {
    it('detects Supabase client anonymous users', () => {
      expect(isAnonymousUser({ is_anonymous: true })).toBe(true)
    })

    it('detects server request anonymous users', () => {
      expect(isAnonymousUser({ isAnonymous: true })).toBe(true)
    })

    it('treats normal users as account users', () => {
      expect(isAccountUser({ is_anonymous: false })).toBe(true)
      expect(isAccountUser(null)).toBe(false)
    })
  })
}
