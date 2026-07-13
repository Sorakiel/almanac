import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  /** Current rating 1–max, or null when unrated. */
  value: number | null
  /** Fired with the new value, or null when the active star is tapped to clear. */
  onChange: (value: number | null) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  'aria-label': string
  disabled?: boolean
}

const SIZES = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
} as const

/** Tap-to-rate stars; tapping the current value clears it. Sized for touch + PC. */
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
        const star = index + 1
        const active = (value ?? 0) >= star
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${star} of ${max}`}
            disabled={disabled}
            onClick={() => onChange(value === star ? null : star)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            <Star
              className={cn(
                SIZES[size],
                'transition-colors',
                active ? 'fill-amber text-amber' : 'text-muted-strong/50',
              )}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
