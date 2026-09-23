import type { TFunction } from '@/hooks/useT'
import type { InsightRange } from '@/features/insights/types'

/** The range pills, in order; labels come from `insights.rangePill.<range>`. */
export const INSIGHT_RANGES: InsightRange[] = ['7d', '30d', 'all']

/**
 * Header comment label, e.g. "// последние 30 дней". Takes `t` as a parameter
 * rather than reaching for the hook, so it stays a pure function of
 * (range, language) and can be called from anywhere.
 */
export function insightRangeLabel(range: InsightRange, t: TFunction): string {
  switch (range) {
    case '7d':
      return t('insights.rangeLast7')
    case '30d':
      return t('insights.rangeLast30')
    case 'all':
      return t('insights.rangeAll')
  }
}

/** Short suffix for stat tiles, e.g. "выполнено · 7d". */
export function insightRangeSuffix(range: InsightRange, t: TFunction): string {
  return range === 'all' ? t('insights.rangeAllShort') : range
}
