import { Navigate, Outlet } from 'react-router-dom'
import { BootSkeleton } from '@/app/shell/BootSkeleton'
import { useSession } from '@/hooks/useSession'

/** Gate authenticated routes; redirect anonymous users to the auth screen. */
export function ProtectedRoute() {
  const { status } = useSession()

  if (status === 'loading') {
    return <BootSkeleton />
  }

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  return <Outlet />
}
