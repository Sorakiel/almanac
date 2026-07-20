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
      kind: 'day_completed',
      done: null,
      total: null,
      days: null,
      units: null,
      unit: null,
      eventDate: TODAY,
      createdAt: `${TODAY}T00:00:00Z`,
      ...over,
    }
  }

  it('shows the day ratio when the day is closed', () => {
    expect(activitySummary(item({ kind: 'day_completed', done: 5, total: 5 }))).toBe(
      'closed the day · 5/5',
    )
  })

  it('summarises a streak milestone without any name', () => {
    expect(activitySummary(item({ kind: 'streak_reached', days: 7 }))).toBe('reached a 7-day streak')
  })

  it('summarises reading with the right unit noun', () => {
    expect(activitySummary(item({ kind: 'reading_progress', units: 12, unit: 'pages' }))).toBe(
      'read 12 pages',
    )
    expect(activitySummary(item({ kind: 'reading_progress', units: 1, unit: 'chapters' }))).toBe(
      'read 1 chapter',
    )
  })
})
