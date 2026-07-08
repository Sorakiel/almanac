import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

interface SessionState {
  status: SessionStatus
  session: Session | null
  user: User | null
  setSession: (session: Session | null) => void
}

/**
 * Auth session state, driven by supabase.onAuthStateChange (wired in
 * providers). supabase-js owns tokens — this store only mirrors the session
 * for the UI.
 */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'anonymous',
    }),
}))
