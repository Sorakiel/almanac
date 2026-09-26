import type { HabitWithTodayLog } from '@/features/habits/types'

/** Today's sections, in the order they read on screen. */
export type TodaySlot = 'morning' | 'afternoon' | 'evening' | 'anytime' | 'week'

export const TODAY_SLOTS: readonly TodaySlot[] = [
  'morning',
  'afternoon',
  'evening',
  'anytime',
  'week',
]

export interface TodayGroup {
  slot: TodaySlot
  habits: HabitWithTodayLog[]
}

export interface TodayPlan {
  /** Still to do today, grouped by time of day; empty groups are dropped. */
  groups: TodayGroup[]
  /** Closed today, in list order: done first, then skipped on purpose. */
  done: HabitWithTodayLog[]
  /** Due today or already done — what the day is measured against. */
  dueCount: number
}

/**
 * Weekly-budget habits ("3× a week", "once a week") belong to the week, not to
 * an hour: done any day, they read under "This week" whatever time was set.
 */
function slotOf(habit: HabitWithTodayLog): TodaySlot {
  if (habit.frequency === 'weekly' || habit.frequency === 'x_per_week') return 'week'
  return habit.time_of_day
}

/**
 * Split the day's habits into what is left (by time of day) and what is done.
 * A habit resting today (an interval not yet due, a weekdays habit at the
 * weekend) is in neither — there is nothing to do about it today.
 *
 * `settling` holds habits just ticked: they stay in their group, drawn as done,
 * until the row has played its exit — otherwise the list jumps under the tap.
 */
export function planToday(
  habits: HabitWithTodayLog[],
  settling: ReadonlySet<string> = new Set(),
): TodayPlan {
  const open = new Map<TodaySlot, HabitWithTodayLog[]>()
  const done: HabitWithTodayLog[] = []
  const skipped: HabitWithTodayLog[] = []
  let dueCount = 0

  for (const habit of habits) {
    // Closed for the day but never owed: out of the total, into "Done".
    if (habit.skippedToday) {
      skipped.push(habit)
      continue
    }
    if (!habit.dueToday && !habit.isComplete) continue
    dueCount += 1
    if (habit.isComplete && !settling.has(habit.id)) {
      done.push(habit)
      continue
    }
    const slot = slotOf(habit)
    open.set(slot, [...(open.get(slot) ?? []), habit])
  }

  const groups = TODAY_SLOTS.flatMap((slot) => {
    const list = open.get(slot)
    return list ? [{ slot, habits: list }] : []
  })
  return { groups, done: [...done, ...skipped], dueCount }
}

/**
 * The one habit worth a nudge: the longest live streak that ends if today does.
 * Null when nothing is at risk — a new user is never told "0%".
 */
export function nudgeHabit(habits: HabitWithTodayLog[]): HabitWithTodayLog | null {
  let best: HabitWithTodayLog | null = null
  for (const habit of habits) {
    if (!habit.atRisk || habit.isComplete) continue
    if (!best || habit.streak > best.streak) best = habit
  }
  return best
}
