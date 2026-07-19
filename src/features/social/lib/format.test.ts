import { describe, expect, it } from 'vitest'
import { activitySummary, feedDayLabel } from '@/features/social/lib/format'
import type { FeedItem } from '@/features/social/types'

const TODAY = '2026-07-19'

describe('feedDayLabel', () => {
  it('labels today and yesterday, else a short date', () => {
    expect(feedDayLabel(TODAY, TODAY)).toBe('Today')
    expect(feedDayLabel('2026-07-18', TODAY)).toBe('Yesterday')
    expect(feedDayLabel('2026-07-04', TODAY)).toBe('4 Jul')
  })
})

describe('activitySummary', () => {
  function item(over: Partial<FeedItem>): FeedItem {
    return {
      id: 'e1',
      friend: { id: 'a', displayName: 'Alice', avatarUrl: null },
      kind: 'habit_completed',
      title: 'Meditate',
      done: null,
      total: null,
      eventDate: TODAY,
      createdAt: `${TODAY}T00:00:00Z`,
      ...over,
    }
  }

  it('names the completed habit', () => {
    expect(activitySummary(item({}))).toBe('completed “Meditate”')
  })

  it('shows the day ratio when the day is closed', () => {
    expect(
      activitySummary(item({ kind: 'day_completed', title: null, done: 5, total: 5 })),
    ).toBe('closed the day · 5/5')
  })
})
