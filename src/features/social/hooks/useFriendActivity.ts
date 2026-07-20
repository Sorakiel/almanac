import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchFriendActivity, fetchProfiles } from '@/features/social/api/social.api'
import { socialKeys } from '@/features/social/hooks/queryKeys'
import { assembleFeed } from '@/features/social/lib/assemble'
import type { FeedItem, FriendProfile } from '@/features/social/types'

interface UseFriendActivityResult {
  feed: FeedItem[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Recent completions from the given friends, newest first. */
export function useFriendActivity(friendIds: string[]): UseFriendActivityResult {
  const { user } = useSession()
  const userId = user?.id ?? ''
  // Key on the friend set so the feed refetches when friendships change.
  const key = [...socialKeys.activity(userId), friendIds.slice().sort().join(',')]

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<FeedItem[]> => {
      const events = await fetchFriendActivity(friendIds)
      const ids = [...new Set(events.map((e) => e.user_id))]
      const profiles = await fetchProfiles(ids)
      const byId = new Map<string, FriendProfile>(profiles.map((p) => [p.id, p]))
      return assembleFeed(events, byId)
    },
    enabled: Boolean(userId) && friendIds.length > 0,
    // Near-real-time: poll while the tab is open and refresh on focus, so a
    // friend's activity shows up without reopening the app.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  })

  return {
    feed: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
