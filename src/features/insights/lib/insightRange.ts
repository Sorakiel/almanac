import type { TFunction } from '@/hooks/useT'
import type { InsightRange } from '@/features/insights/types'

/** The range pills. Values only — the label is the range's own short form. */
export const INSIGHT_RANGE_OPTIONS: { value: InsightRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'ALL' },
]

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
