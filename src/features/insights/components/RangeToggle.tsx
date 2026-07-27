import { INSIGHT_RANGE_OPTIONS } from '@/features/insights/lib/insightRange'
import type { InsightRange } from '@/features/insights/types'
import { cn } from '@/lib/utils'

interface RangeToggleProps {
  value: InsightRange
  onChange: (value: InsightRange) => void
  className?: string
}

/** Compact 7D/30D/ALL segmented control for the insights lookback window. */
export function RangeToggle({ value, onChange, className }: RangeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Insights range"
      className={cn(
        'inline-flex shrink-0 rounded-[11px] border p-0.5 font-mono text-[11px] text-muted',
        className,
      )}
    >
      {INSIGHT_RANGE_OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[9px] px-2.5 py-1.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              active ? 'bg-surface text-foreground' : 'hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
