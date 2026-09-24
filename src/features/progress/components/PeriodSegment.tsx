import type { InsightRange } from '@/features/progress/types'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface PeriodSegmentProps {
  value: InsightRange
  onChange: (value: InsightRange) => void
  className?: string
}

/** Неделя · Месяц · Всё — one period for every number on the screen. */
export function PeriodSegment({ value, onChange, className }: PeriodSegmentProps) {
  const { t } = useT()
  const options: { value: InsightRange; label: string }[] = [
    { value: '7d', label: t('progress.week') },
    { value: '30d', label: t('progress.month') },
    { value: 'all', label: t('progress.all') },
  ]
  return (
    <div
      role="tablist"
      aria-label={t('progress.rangeAria')}
      className={cn('flex rounded-inner bg-sheet-fill p-0.5 dark:bg-foreground/[0.08]', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-footnote font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              active
                ? 'bg-surface shadow-thumb dark:bg-bg'
                : 'text-foreground/80 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
