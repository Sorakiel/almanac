import { cn } from '@/lib/utils'

interface StarRatingProps {
  /** Current rating 1–max, or null when unrated. */
  value: number | null
  /** Fired with the new value, or null when the active pip is tapped to clear. */
  onChange: (value: number | null) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  'aria-label': string
  disabled?: boolean
}

// Larger on mobile for an easier tap target; compact desktop sizes at lg+.
const SIZES = {
  sm: 'h-5 w-5 lg:h-4 lg:w-4',
  md: 'h-7 w-7 lg:h-6 lg:w-6',
  lg: 'h-9 w-9 lg:h-8 lg:w-8',
} as const

/**
 * Tap-to-rate control — a row of square "pixel" pips that fill amber up to the
 * chosen value, matching the block-bar / segmented-gauge language rather than
 * generic stars. Tapping the current value clears it. Sized for touch + PC.
 */
export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  'aria-label': ariaLabel,
  disabled,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {Array.from({ length: max }, (_, index) => {
        const step = index + 1
        const active = (value ?? 0) >= step
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
              'rounded-[4px] border transition-[transform,background-color,border-color] hover:scale-110 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'disabled:opacity-50',
              SIZES[size],
              active
                ? 'border-amber bg-amber'
                : 'border-muted-strong/40 bg-transparent hover:border-amber',
            )}
          />
        )
      })}
    </div>
  )
}
