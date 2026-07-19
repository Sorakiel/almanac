import { describe, expect, it } from 'vitest'
import { currentStreak } from '@/features/habits/lib/streak'
import type { Habit } from '@/features/habits/types'

/** Build ascending date keys ending at `end`, `n` days long (oldest→newest). */
function keysEndingAt(end: string, n: number): string[] {
  const [y, m, d] = end.split('-').map(Number)
  const base = Date.UTC(y!, m! - 1, d!)
  return Array.from({ length: n }, (_, i) => {
    const t = base - (n - 1 - i) * 86_400_000
    return new Date(t).toISOString().slice(0, 10)
  })
}

const daily = { frequency: 'daily', target_count: 1 } as Pick<Habit, 'frequency' | 'target_count'>
const weekdays = { frequency: 'weekdays', target_count: 1 } as Pick<
  Habit,
  'frequency' | 'target_count'
>
const everyThreeDays = { frequency: 'every_n_days', target_count: 3 } as Pick<
  Habit,
  'frequency' | 'target_count'
>
const doneIn = (set: Set<string>) => (key: string) => set.has(key)
const frozenIn = (set: Set<string>) => (key: string) => set.has(key)

describe('currentStreak — daily', () => {
  const keys = keysEndingAt('2026-07-19', 10) // ends Sunday

  it('counts consecutive completed days ending today', () => {
    const done = new Set(keys.slice(-3))
    expect(currentStreak(daily, doneIn(done), keys)).toBe(3)
  })

  it('keeps yesterday-ending run alive while today is still open', () => {
    const done = new Set(keys.slice(-4, -1)) // 3 days, not today
    expect(currentStreak(daily, doneIn(done), keys)).toBe(3)
  })

  it('breaks the streak across a missed day', () => {
    const done = new Set([keys.at(-1)!, keys.at(-3)!]) // gap at yesterday
    expect(currentStreak(daily, doneIn(done), keys)).toBe(1)
  })

  it('is zero with no completions', () => {
    expect(currentStreak(daily, doneIn(new Set()), keys)).toBe(0)
  })
})

describe('currentStreak — freeze', () => {
  const keys = keysEndingAt('2026-07-19', 10)

  it('a frozen missed day bridges the run instead of breaking it', () => {
    const done = new Set([keys.at(-1)!, keys.at(-3)!]) // gap at yesterday
    const frozen = new Set([keys.at(-2)!]) // ...but yesterday is protected
    expect(currentStreak(daily, doneIn(done), keys, frozenIn(frozen))).toBe(2)
  })

  it('a frozen day is a skip — it never adds to the count', () => {
    const frozen = new Set([keys.at(-2)!, keys.at(-3)!])
    expect(currentStreak(daily, doneIn(new Set()), keys, frozenIn(frozen))).toBe(0)
  })

  it('a frozen open today keeps the yesterday-ending run', () => {
    const done = new Set(keys.slice(-4, -1)) // 3 days ending yesterday
    const frozen = new Set([keys.at(-1)!]) // today frozen, not done
    expect(currentStreak(daily, doneIn(done), keys, frozenIn(frozen))).toBe(3)
  })

  it('bridges an interval habit gap wider than N with a freeze', () => {
    // Completions 4 days apart (> 3) would break, but the in-between day is frozen.
    const done = new Set([keys.at(-1)!, keys.at(-5)!])
    const frozen = new Set([keys.at(-3)!])
    expect(currentStreak(everyThreeDays, doneIn(done), keys, frozenIn(frozen))).toBe(2)
  })
})

describe('currentStreak — weekdays', () => {
  // 2026-07-17 is a Friday; the weekend that follows must not break the streak.
  const keys = keysEndingAt('2026-07-20', 12) // ends Monday

  it("weekend gaps don't break a weekdays streak", () => {
    const weekdayKeys = keys.filter((k) => {
      const day = new Date(`${k}T00:00:00Z`).getUTCDay()
      return day !== 0 && day !== 6
    })
    const done = new Set(weekdayKeys) // every weekday done, weekends blank
    expect(currentStreak(weekdays, doneIn(done), keys)).toBe(weekdayKeys.length)
  })
})
