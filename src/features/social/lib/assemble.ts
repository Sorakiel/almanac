import type {
  ActivityEvent,
  ActivityKind,
  FeedItem,
  Friendship,
  FriendProfile,
  FriendsData,
} from '@/features/social/types'

/** The counterparty id of a friendship relative to the current user. */
export function otherPartyId(f: Friendship, userId: string): string {
  return f.requester_id === userId ? f.addressee_id : f.requester_id
}

const FALLBACK: FriendProfile = { id: '', displayName: 'Almanac user', avatarUrl: null }

/**
 * Split friendships into accepted friends, incoming requests (awaiting my
 * response), and outgoing requests (awaiting theirs), each joined to the
 * counterparty's profile. A missing profile falls back to a placeholder so a
 * not-yet-loaded name never crashes the list.
 */
export function assembleFriends(
  friendships: Friendship[],
  profiles: Map<string, FriendProfile>,
  userId: string,
): FriendsData {
  const data: FriendsData = { friends: [], incoming: [], outgoing: [] }
  for (const f of friendships) {
    const otherId = otherPartyId(f, userId)
    const profile = profiles.get(otherId) ?? { ...FALLBACK, id: otherId }
    if (f.status === 'accepted') {
      data.friends.push({ ...profile, friendshipId: f.id, since: f.created_at })
    } else if (f.addressee_id === userId) {
      data.incoming.push({ friendshipId: f.id, profile, createdAt: f.created_at })
    } else {
      data.outgoing.push({ friendshipId: f.id, profile, createdAt: f.created_at })
    }
  }
  return data
}

const KNOWN_KINDS: ActivityKind[] = ['habit_completed', 'day_completed']

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Join raw activity rows to friend profiles, dropping unknown event kinds. */
export function assembleFeed(
  events: ActivityEvent[],
  profiles: Map<string, FriendProfile>,
): FeedItem[] {
  const items: FeedItem[] = []
  for (const e of events) {
    if (!KNOWN_KINDS.includes(e.kind as ActivityKind)) continue
    const friend = profiles.get(e.user_id) ?? { ...FALLBACK, id: e.user_id }
    const meta = (e.meta ?? {}) as Record<string, unknown>
    items.push({
      id: e.id,
      friend,
      kind: e.kind as ActivityKind,
      title: e.title,
      done: toNumber(meta.done),
      total: toNumber(meta.total),
      eventDate: e.event_date,
      createdAt: e.created_at,
    })
  }
  return items
}
