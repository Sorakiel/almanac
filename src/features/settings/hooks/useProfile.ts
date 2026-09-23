import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchOwnProfile, type Profile } from '@/features/settings/api/profiles.api'

interface UseProfileResult {
  profile: Profile | undefined
  isLoading: boolean
  isError: boolean
  /** Waiting for the network with nothing cached — offline on a first visit. */
  isPaused: boolean
  refetch: () => void
}

/** The current user's profile row — role, timezone, display name. */
export function useProfile(): UseProfileResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchOwnProfile(userId),
    enabled: Boolean(userId),
  })

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isPaused: query.fetchStatus === 'paused',
    refetch: () => void query.refetch(),
  }
}
