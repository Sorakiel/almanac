import { describe, expect, it } from 'vitest'
import { groupBooks, libraryStats } from '@/features/reading/lib/library'
import type { Book } from '@/features/reading/types'

let seq = 0
function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: `b${(seq += 1)}`,
    user_id: 'u1',
    title: 'A Book',
    author: null,
    progress_mode: 'pages',
    total_units: null,
    current_unit: 0,
    status: 'to_read',
    started_on: null,
    finished_on: null,
    rating: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

const BOOKS: Book[] = [
  makeBook({ status: 'reading' }),
  makeBook({ status: 'reading' }),
  makeBook({ status: 'to_read' }),
  makeBook({ status: 'finished', finished_on: '2026-02-10' }),
  makeBook({ status: 'finished', finished_on: '2025-12-30' }),
]

describe('groupBooks', () => {
  it('splits books by status', () => {
    const grouped = groupBooks(BOOKS)
    expect(grouped.reading).toHaveLength(2)
    expect(grouped.to_read).toHaveLength(1)
    expect(grouped.finished).toHaveLength(2)
  })
})

describe('libraryStats', () => {
  it('counts totals and finished-this-year', () => {
    const stats = libraryStats(BOOKS, '2026-07-13')
    expect(stats.total).toBe(5)
    expect(stats.reading).toBe(2)
    expect(stats.finished).toBe(2)
    // Only the 2026-02-10 finish falls in the 2026 window.
    expect(stats.finishedThisYear).toBe(1)
  })

  it('is all-zero for an empty shelf', () => {
    const stats = libraryStats([], '2026-07-13')
    expect(stats).toEqual({ total: 0, reading: 0, finished: 0, finishedThisYear: 0 })
  })
})
