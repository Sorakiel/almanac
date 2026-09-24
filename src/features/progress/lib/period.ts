import { addDaysToKey, daysBetween, lastNDateKeys } from '@/lib/date'
import type { FocusInsightsRow } from '@/features/progress/api/focusInsights.api'
import type { ReadingInsightsData } from '@/features/progress/api/readingInsights.api'
import type { ReflectInsightsRow } from '@/features/progress/api/reflectInsights.api'
import type { WorkoutInsightsRow } from '@/features/progress/api/workoutInsights.api'
import type { ExercisePR, InsightRange } from '@/features/progress/types'

/** How many records a card lists when expanded. */
const TOP_PRS = 3
/** Daily bars in the reading card: a week for "Неделя", two otherwise. */
const READING_BARS = { short: 7, long: 14 } as const

/**
 * First date key of the period, or null for "Всё" (no lower bound). The
 * window ends today and includes it, so "Неделя" is today and the six days
 * before it.
 */
export function periodStart(todayKey: string, range: InsightRange): string | null {
  if (range === 'all') return null
  return lastNDateKeys(todayKey, range === '7d' ? 7 : 30)[0]!
}

/** Days the period spans, today included; for "Всё", from the first entry on. */
export function periodDays(todayKey: string, start: string | null, firstKey?: string): number {
  const from = start ?? firstKey
  return from ? Math.max(1, daysBetween(from, todayKey) + 1) : 1
}

const inPeriod = (date: string, start: string | null): boolean => start === null || date >= start

export interface WorkoutPeriod {
  sessions: number
  /** Kilograms moved over done sets (reps × weight). */
  volume: number
  /** Heaviest set per exercise within the period, heaviest first. */
  records: ExercisePR[]
}

/** Completed sessions, volume and records for the period, by the workout's date. */
export function workoutPeriod(rows: WorkoutInsightsRow[], start: string | null): WorkoutPeriod {
  let sessions = 0
  let volume = 0
  const best = new Map<string, ExercisePR>()
  for (const w of rows) {
    const date = (w.completed_at ?? w.scheduled_date ?? w.created_at).slice(0, 10)
    if (!inPeriod(date, start)) continue
    if (w.completed_at) sessions += 1
    for (const we of w.workout_exercises) {
      const name = we.exercises?.name?.trim()
      for (const set of we.set_logs) {
        if (!set.done) continue
        const reps = set.reps ?? 0
        const weight = set.weight ?? 0
        volume += reps * weight
        if (!name || weight <= 0) continue
        const top = best.get(name)
        if (!top || weight > top.weight || (weight === top.weight && reps > top.reps)) {
          best.set(name, { name, weight, reps })
        }
      }
    }
  }
  const records = [...best.values()].sort((a, b) => b.weight - a.weight).slice(0, TOP_PRS)
  return { sessions, volume: Math.round(volume), records }
}

export interface ReadingPeriod {
  pages: number
  /** Pages per day over the period, rounded. */
  perDay: number
  finished: number
  /** Pages per day for the last one or two weeks, oldest first — the bar chart. */
  daily: number[]
  /** When the book being read would be done at this pace, if it can be told. */
  forecast: { title: string; date: string } | null
}

/** Pages read (pages-mode books only, so pages and chapters never mix). */
export function readingPeriod(
  data: ReadingInsightsData,
  start: string | null,
  todayKey: string,
  range: InsightRange,
): ReadingPeriod {
  const pagesMode = new Set(data.books.filter((b) => b.progress_mode === 'pages').map((b) => b.id))
  const byDay = new Map<string, number>()
  let pages = 0
  let first: string | undefined
  for (const s of data.sessions) {
    if (!pagesMode.has(s.book_id)) continue
    byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.units_read)
    if (!first || s.date < first) first = s.date
    if (inPeriod(s.date, start)) pages += s.units_read
  }
  const perDay = Math.round(pages / periodDays(todayKey, start, first))
  const finished = data.books.filter(
    (b) => b.status === 'finished' && b.finished_on && inPeriod(b.finished_on, start),
  ).length
  const bars = range === '7d' ? READING_BARS.short : READING_BARS.long
  const daily = lastNDateKeys(todayKey, bars).map((key) => byDay.get(key) ?? 0)

  const current = data.books.find(
    (b) => b.status === 'reading' && b.progress_mode === 'pages' && (b.total_units ?? 0) > 0,
  )
  const left = current ? (current.total_units ?? 0) - current.current_unit : 0
  const forecast =
    current && perDay > 0 && left > 0
      ? { title: current.title, date: addDaysToKey(todayKey, Math.ceil(left / perDay)) }
      : null

  return { pages, perDay, finished, daily, forecast }
}

export interface FocusPeriod {
  minutes: number
  sessions: number
  /** Average session length in minutes, rounded; 0 with no sessions. */
  average: number
}

export function focusPeriod(rows: FocusInsightsRow[], start: string | null): FocusPeriod {
  const within = rows.filter((r) => inPeriod(r.date, start))
  const minutes = within.reduce((sum, r) => sum + r.minutes, 0)
  return {
    minutes,
    sessions: within.length,
    average: within.length > 0 ? Math.round(minutes / within.length) : 0,
  }
}

export interface ReflectPeriod {
  entries: number
  /** Distinct days with an entry. */
  days: number
  /** Average day rating, one decimal; null when no entry was rated. */
  rating: number | null
}

export function reflectPeriod(rows: ReflectInsightsRow[], start: string | null): ReflectPeriod {
  const within = rows.filter((r) => inPeriod(r.date, start))
  const rated = within.filter((r) => r.day_rating != null)
  const sum = rated.reduce((s, r) => s + (r.day_rating ?? 0), 0)
  return {
    entries: within.length,
    days: new Set(within.map((r) => r.date)).size,
    rating: rated.length > 0 ? Math.round((sum / rated.length) * 10) / 10 : null,
  }
}

/** Which way the period went against the one before it, in percentage points. */
export type Trend = 'better' | 'worse' | 'even'

/** Two points either way is noise, not a direction. */
const TREND_THRESHOLD_PP = 2

export function trendOf(deltaPp: number | undefined): Trend {
  if (deltaPp === undefined || Math.abs(deltaPp) < TREND_THRESHOLD_PP) return 'even'
  return deltaPp > 0 ? 'better' : 'worse'
}
