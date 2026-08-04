import type {
  FocusInsights,
  Insights,
  ReadingInsights,
  ReflectInsights,
  WorkoutInsights,
} from '@/features/insights/types'
import type { TFunction } from '@/hooks/useT'
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
export function buildInsightsLines(
  { habits, workouts, reading, reflect, focus }: CrossModuleData,
  t: TFunction,
  locale: string,
): InsightLine[] {
  const lines: InsightLine[] = []

  if (habits?.hasData) {
    const pct = Math.round(habits.completionRate * 100)
    const delta = habits.completionDelta
    lines.push({
      id: 'habits',
      text:
        delta === undefined
          ? t('insights.lines.habits', { pct })
          : t('insights.lines.habitsDelta', { pct, delta: signed(delta) }),
      tone: delta === undefined || delta >= 0 ? 'good' : 'info',
    })
    if (habits.bestStreak >= 3) {
      lines.push({
        id: 'best-streak',
        text: t('insights.lines.bestStreak', { count: habits.bestStreak }),
        tone: 'info',
      })
    }
  }

  if (workouts?.hasData && workouts.completed30d > 0) {
    lines.push({
      id: 'workouts',
      text: t('insights.lines.workouts', { count: workouts.completed30d }),
      tone: 'good',
    })
  }

  if (reading?.hasData) {
    if (reading.pages30d > 0) {
      lines.push({
        id: 'reading',
        text: t('insights.lines.pages', { count: reading.pages30d }).replace(
          String(reading.pages30d),
          reading.pages30d.toLocaleString(locale),
        ),
        tone: 'good',
      })
    } else if (reading.booksReading > 0) {
      lines.push({
        id: 'reading',
        text: t('insights.lines.booksReading', { count: reading.booksReading }),
        tone: 'info',
      })
    }
  }

  if (reflect?.hasData) {
    if (reflect.currentStreak >= 2) {
      lines.push({
        id: 'reflect',
        text: t('insights.lines.journalStreak', { count: reflect.currentStreak }),
        tone: 'good',
      })
    } else if (reflect.daysJournaled30d > 0) {
      lines.push({
        id: 'reflect',
        text: t('insights.lines.journaled', { count: reflect.daysJournaled30d }),
        tone: 'info',
      })
    }
  }

  if (focus?.hasData && focus.hoursTotal > 0) {
    lines.push({
      id: 'focus',
      text: t('insights.lines.focusHours', { hours: focus.hoursTotal }),
      tone: 'info',
    })
  }

  return lines
}
