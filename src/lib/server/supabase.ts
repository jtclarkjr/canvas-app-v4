import { createClient } from '@supabase/supabase-js'
import { env as privateEnv } from '$env/dynamic/private'
import { internalServerError } from '$lib/server/api-error'

export function getSupabase() {
  const supabaseUrl = privateEnv.SUPABASE_URL
  const supabaseSecretKey = privateEnv.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw internalServerError(
      'Supabase server environment variables are missing.',
      {
        code: 'missing_supabase_env'
      }
    )
  }

  return createClient(supabaseUrl, supabaseSecretKey)
}
