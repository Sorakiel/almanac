import type { Database } from '@/types/database.generated'

export type Friendship = Database['public']['Tables']['friendships']['Row']
export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert']
export type ActivityEvent = Database['public']['Tables']['activity_events']['Row']
export type ActivityEventInsert = Database['public']['Tables']['activity_events']['Insert']

/** Feed event kinds emitted client-side on notable moments. */
export type ActivityKind = 'habit_completed' | 'day_completed'

/** A minimal public view of another user, for lists and the feed. */
export interface FriendProfile {
  id: string
  displayName: string
  avatarUrl: string | null
}

/** An accepted friend plus the relationship row id (to unfriend). */
export interface Friend extends FriendProfile {
  friendshipId: string
  since: string
}

/** A pending request, in either direction, with the counterparty's profile. */
export interface FriendRequest {
  friendshipId: string
  profile: FriendProfile
  createdAt: string
}

/** The three buckets the friends screen renders. */
export interface FriendsData {
  friends: Friend[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
}

/** A feed row: what a friend did, joined with who they are. */
export interface FeedItem {
  id: string
  friend: FriendProfile
  kind: ActivityKind
  title: string | null
  done: number | null
  total: number | null
  eventDate: string
  createdAt: string
}
