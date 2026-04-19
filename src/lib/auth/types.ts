import type {
  Session as SupabaseSession,
  User as SupabaseUser
} from '@supabase/supabase-js'

export type User = SupabaseUser
export type Session = SupabaseSession
export type SessionListener = (session: Session | null) => void
