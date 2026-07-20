import { ratingBarClass, ratingTextClass } from '@/lib/ratingColor'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  /** Current rating 1–max, or null when unrated. */
  value: number | null
  /** Fired with the new value, or null when the active bar is tapped to clear. */
  onChange: (value: number | null) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  'aria-label': string
  disabled?: boolean
}

// Column height + bar width per size. Bars grow left→right so the control reads
// as a level meter (higher = more), not a row of ambiguous checkboxes. Larger
// hit targets on mobile; compact on desktop.
const SIZES = {
  sm: { col: 'h-6 w-3 lg:h-5', gap: 'gap-1' },
  md: { col: 'h-8 w-4 lg:h-7', gap: 'gap-1.5' },
  lg: { col: 'h-10 w-5 lg:h-9', gap: 'gap-1.5' },
} as const

/**
 * Tap-to-rate control — ascending amber bars (an equalizer / level meter) with
 * a mono `n/max` readout, so intensity is obvious at a glance. Tapping the
 * current value clears it. Full-height columns keep tap targets generous.
 */
export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  'aria-label': ariaLabel,
  disabled,
}: StarRatingProps) {
  const s = SIZES[size]
  const fillClass = value ? ratingBarClass(value, max) : 'bg-accent'
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn('flex items-end', s.gap)} role="radiogroup" aria-label={ariaLabel}>
        {Array.from({ length: max }, (_, index) => {
          const step = index + 1
          const active = (value ?? 0) >= step
          // Shortest bar 45% tall, tallest 100%, evenly stepped.
          const barHeight = 45 + (index / (max - 1)) * 55
          return (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${step} of ${max}`}
              disabled={disabled}
              onClick={() => onChange(value === step ? null : step)}
              className={cn(
                'flex items-end justify-center transition-transform hover:scale-110 active:scale-95',
                'focus-visible:rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                'disabled:opacity-50 disabled:hover:scale-100',
                s.col,
              )}
            >
              <span
                aria-hidden="true"
                style={{ height: `${barHeight}%` }}
                className={cn(
                  'w-full rounded-t-[3px] transition-colors',
                  active ? fillClass : 'bg-muted-strong/25',
                )}
              />
            </button>
          )
        })}
      </div>
      <span
        className={cn(
          'font-mono text-xs tabular-nums',
          value ? ratingTextClass(value, max) : 'text-muted-strong',
        )}
      >
        {value ?? '–'}/{max}
      </span>
    </div>
  )
}
