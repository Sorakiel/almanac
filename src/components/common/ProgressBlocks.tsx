import { cn } from '@/lib/utils'

interface ProgressBlocksProps {
  /** Completed units. */
  value: number
  /** Total units. */
  total: number
  /** Number of rendered glyph blocks. */
  blocks?: number
  className?: string
  'aria-label'?: string
}

const DEFAULT_BLOCKS = 10

/**
 * Signature block progress bar, rendered as literal mono glyphs (▓▓▓▓░░░░)
 * exactly like the spec board. Exposed as a meter for screen readers.
 */
export function ProgressBlocks({
  value,
  total,
  blocks = DEFAULT_BLOCKS,
  className,
  'aria-label': ariaLabel,
}: ProgressBlocksProps) {
  const safeTotal = Math.max(total, 1)
  const ratio = Math.min(Math.max(value / safeTotal, 0), 1)
  const filled = Math.round(ratio * blocks)

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      aria-label={ariaLabel ?? `${value} of ${total} complete`}
      className={cn('font-mono text-[13px] leading-none tracking-[0.04em]', className)}
    >
      <span aria-hidden="true" className="text-accent">
        {'▓'.repeat(filled)}
      </span>
      <span aria-hidden="true" className="text-muted-strong/60">
        {'░'.repeat(blocks - filled)}
      </span>
    </div>
  )
}
