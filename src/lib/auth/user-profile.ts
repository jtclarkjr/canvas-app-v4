import type { User } from '$lib/auth/types'

type LooseRecord = Record<string, unknown>

const avatarKeys = [
  'avatar_url',
  'picture',
  'avatar',
  'image',
  'image_url',
  'photo_url'
]

const nameKeys = ['name', 'full_name', 'user_name', 'preferred_username']

function asRecord(value: unknown): LooseRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as LooseRecord
}

function getFirstNonEmptyString(
  record: LooseRecord | null,
  keys: string[]
): string | null {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value !== 'string') {
      continue
    }

    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return null
}

function getIdentityValue(user: User, keys: string[]): string | null {
  const identities = Array.isArray(user.identities) ? user.identities : []

  for (const identity of identities) {
    const record = asRecord(
      (identity as { identity_data?: unknown } | null)?.identity_data
    )
    const value = getFirstNonEmptyString(record, keys)
    if (value) {
      return value
    }
  }

  return null
}

export function getUserDisplayName(user: User | null | undefined) {
  if (!user) {
    return 'Guest'
  }

  const metadata = asRecord(user.user_metadata)
  const name =
    getFirstNonEmptyString(metadata, nameKeys) ?? getIdentityValue(user, nameKeys)
  if (name) {
    return name
  }

  const email = typeof user.email === 'string' ? user.email.trim() : ''
  return email || 'User'
}

export function getUserAvatarUrl(user: User | null | undefined) {
  if (!user) {
    return null
  }

  const metadata = asRecord(user.user_metadata)
  return (
    getFirstNonEmptyString(metadata, avatarKeys) ??
    getIdentityValue(user, avatarKeys)
  )
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  function createUser(overrides: Partial<User> = {}) {
    return {
      id: 'user-1',
      aud: 'authenticated',
      app_metadata: {},
      created_at: '2026-04-19T00:00:00.000Z',
      email: 'person@example.com',
      user_metadata: {},
      identities: [],
      ...overrides
    } as User
  }

  describe('getUserDisplayName', () => {
    it('prefers the metadata name', () => {
      expect(
        getUserDisplayName(
          createUser({ user_metadata: { name: '  Octavia Butler  ' } })
        )
      ).toBe('Octavia Butler')
    })

    it('falls back to the email address', () => {
      expect(
        getUserDisplayName(createUser({ user_metadata: {}, email: 'user@example.com' }))
      ).toBe('user@example.com')
    })
  })

  describe('getUserAvatarUrl', () => {
    it('uses the metadata avatar url when present', () => {
      expect(
        getUserAvatarUrl(
          createUser({
            user_metadata: { avatar_url: 'https://avatars.example.com/octavia.png' }
          })
        )
      ).toBe('https://avatars.example.com/octavia.png')
    })

    it('falls back to picture metadata for providers like Google', () => {
      expect(
        getUserAvatarUrl(
          createUser({
            user_metadata: { picture: 'https://avatars.example.com/google-user.png' }
          })
        )
      ).toBe('https://avatars.example.com/google-user.png')
    })

    it('falls back to identity data when user metadata is empty', () => {
      expect(
        getUserAvatarUrl(
          createUser({
            identities: [
              {
                identity_data: {
                  avatar_url: 'https://avatars.example.com/github-user.png'
                }
              }
            ] as unknown as User['identities']
          })
        )
      ).toBe('https://avatars.example.com/github-user.png')
    })
  })
}
