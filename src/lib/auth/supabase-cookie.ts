export function getSupabaseAuthCookieName(supabaseUrl: string) {
  try {
    const hostname = new URL(supabaseUrl).hostname
    const projectRef = hostname.split('.')[0]

    return projectRef ? `sb-${projectRef}-auth-token` : null
  } catch {
    return null
  }
}
