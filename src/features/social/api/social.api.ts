import { supabase } from '@/lib/supabase'
import type {
  ActivityEvent,
  ActivityEventInsert,
  Friendship,
  FriendProfile,
} from '@/features/social/types'

/** Postgres unique-violation — an already-emitted event or a duplicate request. */
const UNIQUE_VIOLATION = '23505'

/** Every friendship the user is a party to (RLS restricts to their own rows). */
export async function fetchFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Resolve a set of user ids to public profiles. RLS ("select connected") only
 * returns rows for users the caller is friends with or has a pending request
 * with, so this is safe to call with any friendship counterparty id.
 */
export async function fetchProfiles(ids: string[]): Promise<FriendProfile[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', ids)
  if (error) throw error
  return data.map((p) => ({
    id: p.id,
    displayName: p.display_name ?? 'Almanac user',
    avatarUrl: p.avatar_url,
  }))
}

/** Find people to befriend by display name (SECURITY DEFINER RPC, ≥2 chars). */
export async function searchProfiles(query: string): Promise<FriendProfile[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const { data, error } = await supabase.rpc('search_profiles', { q })
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: p.id,
    displayName: p.display_name ?? 'Almanac user',
    avatarUrl: p.avatar_url,
  }))
}

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
  // A duplicate/crossing request just means the link already exists — treat as a no-op.
  if (error && error.code !== UNIQUE_VIOLATION) throw error
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', friendshipId)
  if (error) throw error
}

/** Cancel a sent request, reject an incoming one, or unfriend — all a delete. */
export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}

/** Recent activity from the given friends, newest first (RLS gates visibility). */
export async function fetchFriendActivity(friendIds: string[]): Promise<ActivityEvent[]> {
  if (friendIds.length === 0) return []
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw error
  return data
}

/** Postgres/PostgREST codes for "the table isn't there" (migration not applied). */
const MISSING_TABLE = new Set(['42P01', 'PGRST205'])
/** Latches on once the activity table is confirmed absent, so we stop retrying
 *  every completion until a fresh session (which resets it) picks up the table. */
let activityTableMissing = false

/**
 * Emit an activity event, best-effort. The dedup unique indexes make re-emitting
 * the same habit/day a no-op, so a duplicate-key error is expected and swallowed.
 * If the table doesn't exist yet (migration 0019 unapplied) we latch off after
 * the first attempt rather than failing on every habit toggle.
 */
export async function emitActivity(row: ActivityEventInsert): Promise<void> {
  if (activityTableMissing) return
  const { error } = await supabase.from('activity_events').insert(row)
  if (!error) return
  if (error.code && MISSING_TABLE.has(error.code)) {
    activityTableMissing = true
    return
  }
  if (error.code !== UNIQUE_VIOLATION) throw error
}
