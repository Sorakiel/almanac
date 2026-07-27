import type { InsightRange } from '@/features/insights/types'

export const INSIGHT_RANGE_OPTIONS: { value: InsightRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'ALL' },
]

/** Header comment label, e.g. "// last 30 days". */
export function insightRangeLabel(range: InsightRange): string {
  switch (range) {
    case '7d':
      return 'last 7 days'
    case '30d':
      return 'last 30 days'
    case 'all':
      return 'all time'
  }
}

/** Short suffix for stat tiles, e.g. "done · 7d". */
export function insightRangeSuffix(range: InsightRange): string {
  return range === 'all' ? 'all' : range
}
