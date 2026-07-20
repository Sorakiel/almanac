import { describe, expect, it } from 'vitest'
import { assembleFeed, assembleFriends, otherPartyId } from '@/features/social/lib/assemble'
import type { ActivityEvent, Friendship, FriendProfile } from '@/features/social/types'

const ME = 'me'
const A = 'alice'
const B = 'bob'

const profiles = new Map<string, FriendProfile>([
  [A, { id: A, displayName: 'Alice', avatarUrl: null }],
  [B, { id: B, displayName: 'Bob', avatarUrl: null }],
])

function friendship(over: Partial<Friendship>): Friendship {
  return {
    id: 'f1',
    requester_id: ME,
    addressee_id: A,
    status: 'accepted',
    created_at: '2026-07-10T00:00:00Z',
    responded_at: null,
    ...over,
  }
}

describe('otherPartyId', () => {
  it('returns the counterparty whichever side I am on', () => {
    expect(otherPartyId(friendship({ requester_id: ME, addressee_id: A }), ME)).toBe(A)
    expect(otherPartyId(friendship({ requester_id: B, addressee_id: ME }), ME)).toBe(B)
  })
})

describe('assembleFriends', () => {
  it('buckets accepted, incoming, and outgoing correctly', () => {
    const rows: Friendship[] = [
      friendship({ id: 'accepted', requester_id: ME, addressee_id: A, status: 'accepted' }),
      friendship({ id: 'incoming', requester_id: B, addressee_id: ME, status: 'pending' }),
      friendship({ id: 'outgoing', requester_id: ME, addressee_id: B, status: 'pending' }),
    ]
    const data = assembleFriends(rows, profiles, ME)
    expect(data.friends.map((f) => f.id)).toEqual([A])
    expect(data.friends[0]?.friendshipId).toBe('accepted')
    expect(data.incoming.map((r) => r.profile.id)).toEqual([B])
    expect(data.outgoing.map((r) => r.profile.id)).toEqual([B])
  })

  it('falls back to a placeholder when a profile is missing', () => {
    const rows = [friendship({ id: 'x', addressee_id: 'ghost', status: 'accepted' })]
    const data = assembleFriends(rows, profiles, ME)
    expect(data.friends[0]?.displayName).toBe('Almanac user')
    expect(data.friends[0]?.id).toBe('ghost')
  })
})

describe('assembleFeed', () => {
  function event(over: Partial<ActivityEvent>): ActivityEvent {
    return {
      id: 'e1',
      user_id: A,
      kind: 'day_completed',
      subject: null,
      meta: {},
      event_date: '2026-07-19',
      created_at: '2026-07-19T08:00:00Z',
      ...over,
    }
  }

  it('joins events to friend profiles and reads day totals from meta', () => {
    const feed = assembleFeed(
      [event({ kind: 'day_completed', meta: { done: 5, total: 5 } })],
      profiles,
    )
    expect(feed[0]?.friend.displayName).toBe('Alice')
    expect(feed[0]?.done).toBe(5)
    expect(feed[0]?.total).toBe(5)
  })

  it('reads streak + reading meta and never exposes a name', () => {
    const feed = assembleFeed(
      [
        event({ id: 's', kind: 'streak_reached', subject: 'h1', meta: { days: 7 } }),
        event({
          id: 'r',
          kind: 'reading_progress',
          subject: 'b1',
          meta: { units: 12, unit: 'pages' },
        }),
      ],
      profiles,
    )
    expect(feed.find((f) => f.id === 's')?.days).toBe(7)
    expect(feed.find((f) => f.id === 'r')?.units).toBe(12)
    expect(feed.find((f) => f.id === 'r')?.unit).toBe('pages')
    // No field on FeedItem can carry a habit/book name.
    expect(feed.every((f) => !('title' in f))).toBe(true)
  })

  it('drops unknown / legacy event kinds', () => {
    const feed = assembleFeed([event({ kind: 'habit_completed' })], profiles)
    expect(feed).toHaveLength(0)
  })
})
