import { describe, expect, it } from 'vitest'
import {
  progressFraction,
  progressPct,
  quickAmount,
  statusForProgress,
  unitsReadOn,
  unitNoun,
  unitNounPlural,
} from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'
import { translate } from '@/i18n'
import type { TFunction } from '@/hooks/useT'

const t: TFunction = (key, vars) => translate('en', key, vars)

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b1',
    user_id: 'u1',
    title: 'A Book',
    author: null,
    progress_mode: 'pages',
    total_units: 100,
    current_unit: 0,
    daily_goal: null,
    status: 'to_read',
    started_on: null,
    finished_on: null,
    rating: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('progressFraction / progressPct', () => {
  it('is null when the length is unknown', () => {
    const book = makeBook({ total_units: null, current_unit: 40 })
    expect(progressFraction(book)).toBeNull()
    expect(progressPct(book)).toBeNull()
  })

  it('computes a fraction and rounded percent', () => {
    expect(progressPct(makeBook({ total_units: 200, current_unit: 50 }))).toBe(25)
  })

  it('caps at 100% when past the end', () => {
    expect(progressPct(makeBook({ total_units: 100, current_unit: 150 }))).toBe(100)
  })
})

describe('statusForProgress', () => {
  it('lifts a to_read book to reading on first progress', () => {
    expect(statusForProgress(makeBook({ status: 'to_read' }), 10)).toBe('reading')
  })

  it('auto-finishes when the last unit is reached', () => {
    expect(statusForProgress(makeBook({ status: 'reading', total_units: 100 }), 100)).toBe(
      'finished',
    )
  })

  it('keeps reading below the end', () => {
    expect(statusForProgress(makeBook({ status: 'reading', total_units: 100 }), 80)).toBe('reading')
  })

  it('does not auto-finish without a known length', () => {
    expect(statusForProgress(makeBook({ status: 'reading', total_units: null }), 500)).toBe(
      'reading',
    )
  })
})

describe('unit nouns', () => {
  it('matches the tracking mode', () => {
    expect(unitNoun('pages', t)).toBe('page')
    expect(unitNoun('chapters', t)).toBe('chapter')
    expect(unitNounPlural('pages', t)).toBe('Pages')
    expect(unitNounPlural('chapters', t)).toBe('Chapters')
  })
})

describe('quickAmount', () => {
  it('logs what is left of today’s goal', () => {
    expect(quickAmount(makeBook({ daily_goal: 20, current_unit: 10 }), 5)).toBe(15)
  })

  it('offers the whole goal again once it is met', () => {
    expect(quickAmount(makeBook({ daily_goal: 20, current_unit: 10 }), 25)).toBe(20)
  })

  it('falls back to 10 pages or 1 chapter without a goal', () => {
    expect(quickAmount(makeBook(), 0)).toBe(10)
    expect(quickAmount(makeBook({ progress_mode: 'chapters', total_units: 30 }), 0)).toBe(1)
  })

  it('never logs past the last page, and never less than one', () => {
    expect(quickAmount(makeBook({ daily_goal: 20, current_unit: 96 }), 0)).toBe(4)
    expect(quickAmount(makeBook({ daily_goal: 20, current_unit: 100 }), 0)).toBe(1)
    expect(quickAmount(makeBook({ total_units: null, daily_goal: 30 }), 0)).toBe(30)
  })
})

describe('unitsReadOn', () => {
  it('sums only the given day', () => {
    const sessions = [
      { date: '2026-09-23', units_read: 5 },
      { date: '2026-09-23', units_read: 7 },
      { date: '2026-09-22', units_read: 30 },
    ]
    expect(unitsReadOn(sessions, '2026-09-23')).toBe(12)
  })
})
