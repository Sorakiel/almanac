import { cn } from '@/lib/utils'

interface RatingBarsProps {
  value: number
  max?: number
  'aria-label'?: string
}

/**
 * Read-only rating as a compact row of ascending accent bars — the display twin
 * of the StarRating input, so a rating looks the same whether you're setting or
 * reading it. All `max` bars render; filled ones up to `value`.
 */
export function RatingBars({ value, max = 5, 'aria-label': ariaLabel }: RatingBarsProps) {
  return (
    <span
      className="inline-flex h-3.5 items-end gap-[3px] align-middle"
      role="img"
      aria-label={ariaLabel ?? `${value} of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{ height: `${45 + (i / (max - 1)) * 55}%` }}
          className={cn(
            'w-[3px] rounded-t-[1px]',
            i < value ? 'bg-accent' : 'bg-muted-strong/25',
          )}
        />
      ))}
    </span>
  )
}
