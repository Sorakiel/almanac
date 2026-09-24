import { describe, expect, it } from 'vitest'
import {
  focusPeriod,
  periodDays,
  periodStart,
  readingPeriod,
  reflectPeriod,
  trendOf,
  workoutPeriod,
} from '@/features/progress/lib/period'
import type { WorkoutInsightsRow } from '@/features/progress/api/workoutInsights.api'
import type { ReadingInsightsData } from '@/features/progress/api/readingInsights.api'
import type { Book } from '@/features/reading/types'

const TODAY = '2026-09-25'

describe('periodStart / periodDays', () => {
  it('counts today into the window', () => {
    expect(periodStart(TODAY, '7d')).toBe('2026-09-19')
    expect(periodStart(TODAY, '30d')).toBe('2026-08-27')
    expect(periodStart(TODAY, 'all')).toBeNull()
    expect(periodDays(TODAY, '2026-09-19')).toBe(7)
  })

  it('measures "all" from the first entry', () => {
    expect(periodDays(TODAY, null, '2026-09-16')).toBe(10)
    expect(periodDays(TODAY, null)).toBe(1)
  })
})

function workout(
  date: string,
  done: boolean,
  sets: [string, number, number][],
): WorkoutInsightsRow {
  return {
    id: date,
    name: 'W',
    completed_at: done ? `${date}T10:00:00Z` : null,
    created_at: `${date}T09:00:00Z`,
    scheduled_date: date,
    workout_exercises: sets.map(([name, reps, weight]) => ({
      exercises: { name },
      set_logs: [{ reps, weight, done: true }],
    })),
  }
}

describe('workoutPeriod', () => {
  const rows = [
    workout('2026-09-24', true, [
      ['Жим', 8, 70],
      ['Присед', 5, 90],
    ]),
    workout('2026-09-01', true, [['Жим', 5, 80]]),
    workout('2026-09-23', false, []),
  ]

  it('counts completed sessions and volume inside the window only', () => {
    expect(workoutPeriod(rows, '2026-09-19')).toEqual({
      sessions: 1,
      volume: 8 * 70 + 5 * 90,
      records: [
        { name: 'Присед', weight: 90, reps: 5 },
        { name: 'Жим', weight: 70, reps: 8 },
      ],
    })
  })

  it('takes the heaviest set per exercise over all time for "Всё"', () => {
    expect(workoutPeriod(rows, null).records[1]).toEqual({ name: 'Жим', weight: 80, reps: 5 })
  })
})

function book(over: Partial<Book>): Book {
  return {
    id: 'b',
    user_id: 'u',
    title: 'Книга',
    author: null,
    status: 'reading',
    progress_mode: 'pages',
    current_unit: 100,
    total_units: 200,
    daily_goal: null,
    rating: null,
    started_on: null,
    finished_on: null,
    created_at: '2026-09-01T00:00:00Z',
    ...over,
  } as Book
}

describe('readingPeriod', () => {
  const data: ReadingInsightsData = {
    books: [book({}), book({ id: 'c', progress_mode: 'chapters' })],
    sessions: [
      { book_id: 'b', date: '2026-09-25', units_read: 20, minutes: 30 },
      { book_id: 'b', date: '2026-09-22', units_read: 15, minutes: 20 },
      { book_id: 'c', date: '2026-09-24', units_read: 3, minutes: 60 },
      { book_id: 'b', date: '2026-08-01', units_read: 40, minutes: 60 },
    ],
  }

  it('sums pages from pages-mode books only, per day over the window', () => {
    const week = readingPeriod(data, '2026-09-19', TODAY, '7d')
    expect(week.pages).toBe(35)
    expect(week.perDay).toBe(5)
    expect(week.daily).toEqual([0, 0, 0, 15, 0, 0, 20])
  })

  it('forecasts the finish from the pace', () => {
    expect(readingPeriod(data, '2026-09-19', TODAY, '7d').forecast).toEqual({
      title: 'Книга',
      date: '2026-10-15',
    })
  })
})

describe('focusPeriod / reflectPeriod', () => {
  it('averages focus sessions in the window', () => {
    const rows = [
      { date: '2026-09-25', minutes: 50 },
      { date: '2026-09-24', minutes: 25 },
      { date: '2026-07-01', minutes: 90 },
    ]
    expect(focusPeriod(rows, '2026-09-19')).toEqual({ minutes: 75, sessions: 2, average: 38 })
  })

  it('averages only rated reflections', () => {
    const rows = [
      { date: '2026-09-25', day_rating: 4 },
      { date: '2026-09-25', day_rating: null },
      { date: '2026-09-20', day_rating: 3 },
    ]
    expect(reflectPeriod(rows, '2026-09-19')).toEqual({ entries: 3, days: 2, rating: 3.5 })
  })
})

describe('trendOf', () => {
  it('calls small moves even', () => {
    expect(trendOf(14)).toBe('better')
    expect(trendOf(-5)).toBe('worse')
    expect(trendOf(1)).toBe('even')
    expect(trendOf(undefined)).toBe('even')
  })
})
