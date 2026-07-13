import { describe, expect, it } from 'vitest'
import {
  progressFraction,
  progressPct,
  statusForProgress,
  unitNoun,
  unitNounPlural,
} from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b1',
    user_id: 'u1',
    title: 'A Book',
    author: null,
    progress_mode: 'pages',
    total_units: 100,
    current_unit: 0,
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
    expect(unitNoun('pages')).toBe('page')
    expect(unitNoun('chapters')).toBe('chapter')
    expect(unitNounPlural('pages')).toBe('pages')
    expect(unitNounPlural('chapters')).toBe('chapters')
  })
})
