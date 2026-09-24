import { addDaysToKey, daysBetween, weekdayOfKey } from '@/lib/date'

/** Half a year of weeks — the phone's width at 9px cells, and the prototype's. */
export const ALMANAC_WEEKS = 26

/** Fill level of one cell: nothing, a little, most, all of what was due. */
export type AlmanacLevel = 0 | 1 | 2 | 3

export interface AlmanacCell {
  date: string
  level: AlmanacLevel
  today: boolean
  /** Past today — drawn as an empty slot rather than a zero. */
  future: boolean
}

export interface DayScore {
  date: string
  done: number
  due: number
}

/** Monday of the week `dateKey` falls in (weeks start on Monday here, as in ru). */
export function weekStartKey(dateKey: string): string {
  const offset = (weekdayOfKey(dateKey) + 6) % 7
  return addDaysToKey(dateKey, -offset)
}

/** First day the grid shows: Monday, `ALMANAC_WEEKS - 1` weeks before this one. */
export function almanacStartKey(todayKey: string, weeks = ALMANAC_WEEKS): string {
  return addDaysToKey(weekStartKey(todayKey), -(weeks - 1) * 7)
}

/**
 * How a day reads on the grid. Any check-off lights the cell — the grid is about
 * showing up — and the tint deepens with the share of the day's schedule kept.
 */
export function levelOf(done: number, due: number): AlmanacLevel {
  if (done <= 0) return 0
  const ratio = due > 0 ? done / due : 1
  if (ratio >= 1) return 3
  if (ratio >= 0.5) return 2
  return 1
}

/**
 * The grid, week by week: `weeks` columns of seven Monday-first cells ending
 * with the current week. Days after today are placeholders so the last column
 * keeps its shape.
 */
export function buildAlmanacGrid(
  scores: DayScore[],
  todayKey: string,
  weeks = ALMANAC_WEEKS,
): AlmanacCell[][] {
  const byDate = new Map(scores.map((s) => [s.date, s]))
  const start = almanacStartKey(todayKey, weeks)
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDaysToKey(start, w * 7 + d)
      const score = byDate.get(date)
      return {
        date,
        level: score ? levelOf(score.done, score.due) : 0,
        today: date === todayKey,
        future: date > todayKey,
      }
    }),
  )
}

export interface ActiveDays {
  active: number
  total: number
}

/**
 * Days with at least one check-off, out of the days since joining that the
 * scores cover. The avatar's ring draws this ratio.
 */
export function countActiveDays(
  scores: DayScore[],
  joinedKey: string | null,
  todayKey: string,
): ActiveDays {
  const first = scores[0]?.date
  if (!first) return { active: 0, total: 0 }
  const from = joinedKey && joinedKey > first ? joinedKey : first
  const inRange = scores.filter((s) => s.date >= from && s.date <= todayKey)
  return {
    active: inRange.filter((s) => s.done > 0).length,
    total: Math.max(1, daysBetween(from, todayKey) + 1),
  }
}
