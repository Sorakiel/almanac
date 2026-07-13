import { describe, expect, it } from 'vitest'
import { computeReadingInsights } from '@/features/insights/lib/computeReadingInsights'
import type { ReadingInsightsData } from '@/features/insights/api/readingInsights.api'
import type { Book } from '@/features/reading/types'

let seq = 0
function book(overrides: Partial<Book> = {}): Book {
  return {
    id: `bk${(seq += 1)}`,
    user_id: 'u1',
    title: 'Book',
    author: null,
    progress_mode: 'pages',
    total_units: 300,
    current_unit: 0,
    status: 'reading',
    started_on: null,
    finished_on: null,
    rating: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeReadingInsights', () => {
  it('is empty for no books', () => {
    const out = computeReadingInsights({ books: [], sessions: [] }, '2026-07-13')
    expect(out.hasData).toBe(false)
    expect(out.pages30d).toBe(0)
  })

  it('counts statuses, 30d pages/minutes/sessions, and finished-this-year', () => {
    const reading = book({ status: 'reading', progress_mode: 'pages', current_unit: 120 })
    const chapters = book({ status: 'reading', progress_mode: 'chapters' })
    const data: ReadingInsightsData = {
      books: [
        reading,
        chapters,
        book({ status: 'finished', finished_on: '2026-03-01' }),
        book({ status: 'finished', finished_on: '2025-11-01' }),
      ],
      sessions: [
        { book_id: reading.id, minutes: 30, units_read: 20, date: '2026-07-13' },
        { book_id: reading.id, minutes: 25, units_read: 15, date: '2026-07-01' },
        // Chapters-mode units must NOT count toward pages.
        { book_id: chapters.id, minutes: 10, units_read: 2, date: '2026-07-12' },
        // Outside the 30-day window — excluded entirely.
        { book_id: reading.id, minutes: 99, units_read: 99, date: '2026-05-01' },
      ],
    }

    const out = computeReadingInsights(data, '2026-07-13')
    expect(out.booksReading).toBe(2)
    expect(out.booksFinished).toBe(2)
    expect(out.finishedThisYear).toBe(1)
    expect(out.pages30d).toBe(35) // 20 + 15 pages-mode only
    expect(out.minutes30d).toBe(65) // 30 + 25 + 10
    expect(out.sessions30d).toBe(3)
    expect(out.currentlyReading).toHaveLength(2)
  })
})
