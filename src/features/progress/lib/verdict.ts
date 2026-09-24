import type { TFunction } from '@/hooks/useT'
import { trendOf, type Trend } from '@/features/progress/lib/period'
import type { TranslationKey } from '@/i18n/types'
import type { InsightRange, Insights } from '@/features/progress/types'

export interface Verdict {
  title: string
  line: string
}

/**
 * The one sentence at the top of Progress, and the line under it. Built from
 * the habit numbers, because habits are the one module everybody has on.
 */
export function verdictOf(
  habits: Insights | null,
  range: InsightRange,
  t: TFunction,
  opts: { days: number; joined: string | null },
): Verdict {
  if (!habits?.hasData) return { title: t('progress.noCheckOffs'), line: '' }
  const pct = Math.round(habits.completionRate * 100)

  if (range === 'all') {
    const steadiest = habits.byHabit[0]?.name
    return {
      title: t('progress.allTitle', { count: opts.days }),
      line: !opts.joined
        ? t('progress.rateLine', { pct })
        : steadiest
          ? t('progress.allLine', { date: opts.joined, name: steadiest })
          : t('progress.allLineBare', { date: opts.joined }),
    }
  }

  const trend = trendOf(habits.completionDelta)
  const key: Record<Trend, TranslationKey> =
    range === '7d'
      ? { better: 'progress.weekBetter', worse: 'progress.weekWorse', even: 'progress.weekEven' }
      : { better: 'progress.monthBetter', worse: 'progress.monthWorse', even: 'progress.monthEven' }
  const delta = habits.completionDelta
  return {
    title: t(key[trend]),
    line:
      delta === undefined || delta === 0
        ? t('progress.rateLine', { pct })
        : t('progress.rateDelta', { pct, delta: delta > 0 ? `+${delta}` : String(delta) }),
  }
}

/** "8,6 ч" — hours to one decimal, for a number that must fit a narrow column. */
export function hoursLabel(minutes: number, t: TFunction, intl: string): string {
  const h = Math.round((minutes / 60) * 10) / 10
  return t('progress.hours', { h: h.toLocaleString(intl) })
}

/** "8 ч 35 мин", "40 мин", "2 ч" — a duration the way people say it. */
export function durationLabel(minutes: number, t: TFunction): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return t('progress.minutes', { m })
  if (m === 0) return t('progress.hours', { h })
  return t('progress.hoursMinutes', { h, m })
}
