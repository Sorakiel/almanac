import type { ReflectInsights } from '@/features/insights/types'
import type { Reflection } from '@/features/reflect/types'
import type { TFunction } from '@/hooks/useT'
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
 * Rule-based journaling observations derived from reflections + reflect insights,
 * most-actionable first (a lapse leads; stats trail). Feeds the shared
 * InsightTicker on the Reflect rail / page.
 */
export function buildReflectLines(
  reflections: Reflection[],
  insights: ReflectInsights | null,
  dateKey: string,
  t: TFunction,
): InsightLine[] {
  if (reflections.length === 0) return []

  const lines: InsightLine[] = []
  const wroteToday = reflections.some((r) => r.date === dateKey)
  const lastEntry = reflections
    .map((r) => r.date)
    .sort()
    .at(-1)

  if (wroteToday) {
    lines.push({ id: 'today', text: t('reflect.journaledToday'), tone: 'good' })
  } else if (lastEntry) {
    const days = daysBetween(lastEntry, dateKey)
    lines.push({
      id: 'gap',
      text: days <= 1 ? t('reflect.noEntryToday') : t('reflect.lines.gap', { count: days }),
      tone: days >= 3 ? 'urgent' : 'info',
    })
  }

  if (insights?.currentStreak && insights.currentStreak >= 2) {
    lines.push({
      id: 'streak',
      text: t('reflect.lines.streak', { count: insights.currentStreak }),
      tone: 'good',
    })
  }

  if (insights?.hasData) {
    if (insights.daysJournaled30d > 0) {
      lines.push({
        id: 'days-30d',
        text: t('reflect.lines.days30', { count: insights.daysJournaled30d }),
        tone: 'info',
      })
    }
    if (insights.avgDayRating30d !== null) {
      lines.push({
        id: 'rating',
        text: t('reflect.lines.rating', { rating: insights.avgDayRating30d.toFixed(1) }),
        tone: insights.avgDayRating30d >= 3.5 ? 'good' : 'info',
      })
    }
    if (insights.consistency30d > 0) {
      lines.push({
        id: 'consistency',
        text: t('reflect.lines.consistency', { pct: Math.round(insights.consistency30d * 100) }),
        tone: 'info',
      })
    }
  }

  return lines
}
