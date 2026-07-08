import { cn } from '@/lib/utils'

interface ProgressBlocksProps {
  /** Completed units. */
  value: number
  /** Total units. */
  total: number
  /** Number of rendered blocks (defaults to `total`, capped for wide targets). */
  blocks?: number
  className?: string
  'aria-label'?: string
}

const MAX_BLOCKS = 12

/**
 * Signature block progress bar (▓▓▓▓░░░░). Renders filled/empty segments as a
 * meter for screen readers.
 */
export function ProgressBlocks({
  value,
  total,
  blocks,
  className,
  'aria-label': ariaLabel,
}: ProgressBlocksProps) {
  const safeTotal = Math.max(total, 1)
  const count = Math.min(blocks ?? safeTotal, MAX_BLOCKS)
  const ratio = Math.min(Math.max(value / safeTotal, 0), 1)
  const filled = Math.round(ratio * count)

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      aria-label={ariaLabel ?? `${value} of ${total} complete`}
      className={cn('flex gap-1', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'h-2 flex-1 rounded-sm transition-colors',
            i < filled ? 'bg-accent' : 'bg-border/40',
          )}
        />
      ))}
    </div>
  )
}
