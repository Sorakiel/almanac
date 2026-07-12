import { lastNDateKeys } from '@/lib/date'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import type { Habit } from '@/features/habits/types'
import type { AdminUserDetail, Feedback, Profile, UserHabitRow } from '@/features/admin/types'
import type { Database } from '@/types/database.generated'

type HabitRow = Database['public']['Tables']['habits']['Row']
type HabitLogLite = { habit_id: string; date: string; count: number }

const WINDOW = 30

function nameOf(p: Profile): string {
  return p.display_name?.trim() || `member-${p.id.slice(0, 6)}`
}

/**
 * Assemble a user's admin detail from raw rows. Pure — the 30-day window is
 * built from `todayKey` (the admin's local date). A "done day" is a log with
 * count >= 1; completion approximates each habit as daily-expected, which is a
 * deliberate glance-level metric, not the per-cadence rate on the user's own
 * Insights.
 */
export function computeUserDetail(
  profile: Profile,
  habits: HabitRow[],
  logs: HabitLogLite[],
  feedback: Feedback[],
  todayKey: string,
): AdminUserDetail {
  const windowKeys = new Set(lastNDateKeys(todayKey, WINDOW))
  const doneInWindow = logs.filter((l) => l.count >= 1 && windowKeys.has(l.date))

  // Distinct done days per habit, and overall active days.
  const doneDaysByHabit = new Map<string, Set<string>>()
  const activeDays = new Set<string>()
  for (const log of doneInWindow) {
    activeDays.add(log.date)
    const set = doneDaysByHabit.get(log.habit_id) ?? new Set<string>()
    set.add(log.date)
    doneDaysByHabit.set(log.habit_id, set)
  }

  const habitRows: UserHabitRow[] = habits.map((h) => ({
    id: h.id,
    name: h.name,
    frequencyLabel: frequencyLabel(h as Habit),
    doneLast30: doneDaysByHabit.get(h.id)?.size ?? 0,
  }))

  const totalDone = habitRows.reduce((sum, h) => sum + h.doneLast30, 0)
  const completionPct =
    habits.length > 0 ? Math.round((100 * totalDone) / (habits.length * WINDOW)) : 0

  return {
    id: profile.id,
    name: nameOf(profile),
    role: profile.role,
    joinedAt: profile.created_at,
    timezone: profile.timezone ?? null,
    stats: {
      habits: habits.length,
      logs: doneInWindow.length,
      completionPct,
      activeDays30: activeDays.size,
    },
    habits: habitRows,
    feedback: feedback.map((f) => ({
      id: f.id,
      body: f.body,
      status: f.status,
      createdAt: f.created_at,
      authorName: nameOf(profile),
    })),
  }
}
