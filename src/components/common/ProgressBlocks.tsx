import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ProgressBlocksProps {
  /** Completed units. */
  value: number
  /** Total units. */
  total: number
  /** Number of rendered glyph blocks. */
  blocks?: number
  /** Glyph scale — `lg` for the prominent home-screen bar. */
  size?: 'sm' | 'md' | 'lg'
  /** Animate the fill in on mount / when the value changes. */
  animated?: boolean
  /** CSS color for the filled glyphs; defaults to the brand accent. */
  color?: string
  className?: string
  'aria-label'?: string
}

const DEFAULT_BLOCKS = 10
const SIZES = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-2xl',
} as const

/**
 * Signature block progress bar, rendered as literal mono glyphs (▓▓▓▓░░░░)
 * exactly like the spec board. A track of empty blocks sits under a clipped
 * accent-filled layer whose width can transition, giving a left-to-right fill
 * animation while keeping the block aesthetic. Exposed as a meter for a11y.
 */
export function ProgressBlocks({
  value,
  total,
  blocks = DEFAULT_BLOCKS,
  size = 'sm',
  animated = false,
  color,
  className,
  'aria-label': ariaLabel,
}: ProgressBlocksProps) {
  const safeTotal = Math.max(total, 1)
  const ratio = Math.min(Math.max(value / safeTotal, 0), 1)

  // Start at 0 when animating so the fill grows in after first paint; a plain
  // (non-animated) bar just reads the ratio directly with no state churn.
  const [animatedShown, setAnimatedShown] = useState(0)
  useEffect(() => {
    if (!animated) return
    const id = requestAnimationFrame(() => setAnimatedShown(ratio))
    return () => cancelAnimationFrame(id)
  }, [ratio, animated])
  const shown = animated ? animatedShown : ratio

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      aria-label={ariaLabel ?? `${value} of ${total} complete`}
      className={cn('relative inline-block max-w-full overflow-hidden leading-none', className)}
    >
      <span
        aria-hidden="true"
        className={cn('block font-mono tracking-[0.04em] text-muted-strong/40', SIZES[size])}
      >
        {'░'.repeat(blocks)}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 overflow-hidden whitespace-nowrap font-mono tracking-[0.04em] text-accent',
          animated && 'transition-[width] duration-700 ease-out',
          SIZES[size],
        )}
        style={{ width: `${shown * 100}%`, color }}
      >
        {'▓'.repeat(blocks)}
      </span>
    </div>
  )
}
