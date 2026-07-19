import { weekdayOfKey } from '@/lib/date'
import { intervalDays } from '@/features/habits/lib/frequency'
import type { Habit } from '@/features/habits/types'

type StreakHabit = Pick<Habit, 'frequency' | 'target_count'>

/** Days-of-week that a `weekdays` habit rests on (Sun=0, Sat=6). */
function isWeekday(key: string): boolean {
  const day = weekdayOfKey(key)
  return day !== 0 && day !== 6
}

/** No day is frozen — the default when a caller doesn't track freezes. */
const noFreeze = (): boolean => false

/**
 * Consecutive completed days ending at (or just before) today. Unlike the
 * detail page's streak, this *tolerates an as-yet-incomplete today*: if today
 * is due but not done, the run ending yesterday is still returned — that's the
 * live streak the user can still keep or lose, which powers the at-risk nudge.
 *
 * A frozen day is a deliberate skip: it neither counts toward the run nor
 * breaks it, so a protected miss keeps the streak alive.
 */
function dailyStreak(
  doneOn: (key: string) => boolean,
  frozenOn: (key: string) => boolean,
  keys: string[],
  todayKey: string,
): number {
  let streak = 0
  for (let i = keys.length - 1; i >= 0; i--) {
    const key = keys[i]!
    // Today is still open — it neither counts nor breaks the streak yet.
    if (key === todayKey && !doneOn(key)) continue
    if (doneOn(key)) streak++
    else if (frozenOn(key)) continue
    else break
  }
  return streak
}

/**
 * Streak for every-N-days habits: consecutive completions no more than N days
 * apart. It survives until a due day is missed, so today being open (within N
 * days of the last completion) keeps the streak alive. A frozen day acts as a
 * mark that bridges the spacing without adding to the count.
 */
function intervalStreak(
  doneOn: (key: string) => boolean,
  frozenOn: (key: string) => boolean,
  keys: string[],
  n: number,
): number {
  const marks: { i: number; done: boolean }[] = []
  for (let i = 0; i < keys.length; i++) {
    const done = doneOn(keys[i]!)
    if (done || frozenOn(keys[i]!)) marks.push({ i, done })
  }

  const today = keys.length - 1
  const last = marks.at(-1)
  if (last === undefined || today - last.i > n) return 0

  let run = last.done ? 1 : 0
  for (let j = marks.length - 1; j > 0; j--) {
    if (marks[j]!.i - marks[j - 1]!.i > n) break
    if (marks[j - 1]!.done) run++
  }
  return run
}

/**
 * Current streak for the habits list / dashboard render unit. Schedule-aware:
 * a `weekdays` habit's weekends don't break it, and interval habits use spacing
 * rather than raw day runs. `windowKeys` runs oldest→newest, ending today.
 * `frozenOn` marks days the user protected (заморозка) — treated as skips.
 */
export function currentStreak(
  habit: StreakHabit,
  doneOn: (key: string) => boolean,
  windowKeys: string[],
  frozenOn: (key: string) => boolean = noFreeze,
): number {
  if (windowKeys.length === 0) return 0
  const todayKey = windowKeys[windowKeys.length - 1]!

  const n = intervalDays(habit)
  if (n !== null) return intervalStreak(doneOn, frozenOn, windowKeys, n)

  if (habit.frequency === 'weekdays') {
    return dailyStreak(doneOn, frozenOn, windowKeys.filter(isWeekday), todayKey)
  }
  return dailyStreak(doneOn, frozenOn, windowKeys, todayKey)
}
