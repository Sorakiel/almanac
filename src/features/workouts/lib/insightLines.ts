import type { WorkoutInsights } from '@/features/insights/types'
import type { WorkoutView } from '@/features/workouts/types'
import type { InsightLine } from '@/lib/insight'

/** Whole days from `fromKey` to `toKey` (both `YYYY-MM-DD`), parsed as UTC. */
function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  const from = Date.UTC(fy ?? 1970, (fm ?? 1) - 1, fd ?? 1)
  const to = Date.UTC(ty ?? 1970, (tm ?? 1) - 1, td ?? 1)
  return Math.round((to - from) / 86_400_000)
}

/**
 * Rule-based training observations derived from the user's workouts + insights,
 * most-actionable first (an overdue session leads; snapshots trail). Feeds the
 * shared InsightTicker on the Workouts rail / page.
 */
export function buildWorkoutLines(
  workouts: WorkoutView[],
  insights: WorkoutInsights | null,
  dateKey: string,
): InsightLine[] {
  if (workouts.length === 0) return []

  const lines: InsightLine[] = []
  const scheduled = workouts.filter((w) => w.status === 'scheduled')
  const dueToday = scheduled.filter((w) => w.scheduled_date === dateKey)
  const overdue = scheduled.filter((w) => w.scheduled_date && w.scheduled_date < dateKey)
  const upcoming = scheduled.filter((w) => w.scheduled_date && w.scheduled_date > dateKey)

  // Most urgent: something on the plan for today or already past due.
  if (dueToday.length > 0) {
    lines.push({
      id: 'due-today',
      text: `${dueToday.length} session${dueToday.length > 1 ? 's' : ''} on the plan for today.`,
      tone: 'urgent',
    })
  } else if (overdue.length > 0) {
    lines.push({
      id: 'overdue',
      text: `${overdue.length} planned session${overdue.length > 1 ? 's' : ''} overdue — run or reschedule.`,
      tone: 'urgent',
    })
  }

  // Days since the last completed session.
  const lastDone = workouts
    .filter((w) => w.status === 'completed' && w.completed_at)
    .map((w) => w.completed_at!.slice(0, 10))
    .sort()
    .at(-1)
  if (lastDone) {
    const days = daysBetween(lastDone, dateKey)
    if (days >= 4) {
      lines.push({
        id: 'rest',
        text: `${days} days since your last session — time to move.`,
        tone: 'urgent',
      })
    } else {
      lines.push({
        id: 'last',
        text:
          days <= 0
            ? 'You trained today. Nice work.'
            : `Last session was ${days} day${days > 1 ? 's' : ''} ago.`,
        tone: 'good',
      })
    }
  }

  if (upcoming.length > 0) {
    lines.push({
      id: 'upcoming',
      text: `${upcoming.length} session${upcoming.length > 1 ? 's' : ''} coming up on your plan.`,
      tone: 'info',
    })
  }

  // Snapshots from the aggregated insights.
  if (insights?.hasData) {
    const pr = insights.prs[0]
    if (pr) {
      lines.push({
        id: 'pr',
        text: `Heaviest lift on record: ${pr.name} at ${pr.weight}kg × ${pr.reps}.`,
        tone: 'good',
      })
    }
    if (insights.completed30d > 0) {
      lines.push({
        id: 'done-30d',
        text: `${insights.completed30d} session${insights.completed30d > 1 ? 's' : ''} done in the last 30 days.`,
        tone: insights.completed30d >= 8 ? 'good' : 'info',
      })
    }
    if (insights.volume30d > 0) {
      lines.push({
        id: 'volume',
        text: `${Math.round(insights.volume30d).toLocaleString('en-US')}kg of volume moved this month.`,
        tone: 'info',
      })
    }
    const top = insights.topExercises[0]
    if (top) {
      lines.push({
        id: 'top-ex',
        text: `Most-trained lift: ${top.name} across ${top.sessions} session${top.sessions > 1 ? 's' : ''}.`,
        tone: 'info',
      })
    }
  }

  return lines
}
