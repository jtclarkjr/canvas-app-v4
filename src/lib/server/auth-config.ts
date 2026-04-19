import { env as privateEnv } from '$env/dynamic/private'

export type AuthConfig = {
  configured: boolean
  providers: {
    email: boolean
    github: boolean
    google: boolean
    apple: boolean
  }
}

const flag = (value: string | undefined): boolean =>
  !!value && value.toLowerCase() !== 'false' && value !== '0'

export function getAuthConfig(): AuthConfig {
  const hasUrl = !!privateEnv.SUPABASE_URL || !!privateEnv.VITE_SUPABASE_URL
  const hasPublishableKey = !!privateEnv.VITE_SUPABASE_PUBLISHABLE_KEY
  const configured = hasUrl && hasPublishableKey

  return {
    configured,
    providers: {
      email: configured,
      github: configured && flag(privateEnv.ENABLE_GITHUB_AUTH),
      google: configured && flag(privateEnv.ENABLE_GOOGLE_AUTH),
      apple: configured && flag(privateEnv.ENABLE_APPLE_AUTH)
    }
  }
}
