import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchFriendships, fetchProfiles } from '@/features/social/api/social.api'
import { socialKeys } from '@/features/social/hooks/queryKeys'
import { assembleFriends, otherPartyId } from '@/features/social/lib/assemble'
import type { FriendProfile, FriendsData } from '@/features/social/types'

interface UseFriendsResult {
  data: FriendsData
  friendIds: string[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const EMPTY: FriendsData = { friends: [], incoming: [], outgoing: [] }

/** Friends + pending requests (both directions), joined to counterparty profiles. */
export function useFriends(): UseFriendsResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: socialKeys.friendships(userId),
    queryFn: async (): Promise<FriendsData> => {
      const friendships = await fetchFriendships(userId)
      const otherIds = [...new Set(friendships.map((f) => otherPartyId(f, userId)))]
      const profiles = await fetchProfiles(otherIds)
      const byId = new Map<string, FriendProfile>(profiles.map((p) => [p.id, p]))
      return assembleFriends(friendships, byId, userId)
    },
    enabled: Boolean(userId),
    // Surface new incoming requests / accepted friends without an app restart.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const data = query.data ?? EMPTY
  return {
    data,
    friendIds: data.friends.map((f) => f.id),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
