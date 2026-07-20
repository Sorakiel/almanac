import type {
  FocusInsights,
  Insights,
  ReadingInsights,
  ReflectInsights,
  WorkoutInsights,
} from '@/features/insights/types'
import type { InsightLine } from '@/lib/insight'

interface CrossModuleData {
  habits: Insights | null
  workouts: WorkoutInsights | null
  reading: ReadingInsights | null
  reflect: ReflectInsights | null
  focus: FocusInsights | null
}

function signed(n: number): string {
  return `${n >= 0 ? '+' : ''}${n}`
}

/**
 * A cross-module readout: one headline observation per module that has data,
 * ordered habits → training → reading → reflect → focus. Feeds the shared
 * InsightTicker on the Insights rail / page.
 */
export function buildInsightsLines({
  habits,
  workouts,
  reading,
  reflect,
  focus,
}: CrossModuleData): InsightLine[] {
  const lines: InsightLine[] = []

  if (habits?.hasData) {
    const pct = Math.round(habits.completionRate * 100)
    lines.push({
      id: 'habits',
      text: `Habits at ${pct}% over 30 days (${signed(habits.completionDelta)}% vs prior).`,
      tone: habits.completionDelta >= 0 ? 'good' : 'info',
    })
    if (habits.bestStreak >= 3) {
      lines.push({
        id: 'best-streak',
        text: `Best run across habits: ${habits.bestStreak} days.`,
        tone: 'info',
      })
    }
  }

  if (workouts?.hasData && workouts.completed30d > 0) {
    lines.push({
      id: 'workouts',
      text: `${workouts.completed30d} training session${workouts.completed30d > 1 ? 's' : ''} logged this month.`,
      tone: 'good',
    })
  }

  if (reading?.hasData) {
    if (reading.pages30d > 0) {
      lines.push({
        id: 'reading',
        text: `${reading.pages30d.toLocaleString('en-US')} pages read in the last 30 days.`,
        tone: 'good',
      })
    } else if (reading.booksReading > 0) {
      lines.push({
        id: 'reading',
        text: `${reading.booksReading} book${reading.booksReading > 1 ? 's' : ''} in progress.`,
        tone: 'info',
      })
    }
  }

  if (reflect?.hasData) {
    if (reflect.currentStreak >= 2) {
      lines.push({
        id: 'reflect',
        text: `${reflect.currentStreak}-day journaling streak going.`,
        tone: 'good',
      })
    } else if (reflect.daysJournaled30d > 0) {
      lines.push({
        id: 'reflect',
        text: `Journaled ${reflect.daysJournaled30d} day${reflect.daysJournaled30d > 1 ? 's' : ''} this month.`,
        tone: 'info',
      })
    }
  }

  if (focus?.hasData && focus.hoursTotal > 0) {
    lines.push({
      id: 'focus',
      text: `${focus.hoursTotal}h of deep work logged all-time.`,
      tone: 'info',
    })
  }

  return lines
}
