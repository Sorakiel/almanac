import { Navigate, Outlet } from 'react-router-dom'
import { LoadingState } from '@/components/common/LoadingState'
import { useSession } from '@/hooks/useSession'

/** Gate authenticated routes; redirect anonymous users to the auth screen. */
export function ProtectedRoute() {
  const { status } = useSession()

  if (status === 'loading') {
    return <LoadingState fullScreen />
  }

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  return <Outlet />
}
