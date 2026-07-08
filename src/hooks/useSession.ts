import { useSessionStore, type SessionStatus } from '@/stores/session'
import type { Session, User } from '@supabase/supabase-js'

interface UseSessionResult {
  status: SessionStatus
  session: Session | null
  user: User | null
}

/** Read-only view of the current auth session for components. */
export function useSession(): UseSessionResult {
  const status = useSessionStore((s) => s.status)
  const session = useSessionStore((s) => s.session)
  const user = useSessionStore((s) => s.user)
  return { status, session, user }
}
