import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSession } from '@/hooks/useSession'

/** Gate authenticated routes; redirect anonymous users to the auth screen. */
export function ProtectedRoute() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  return <Outlet />
}
