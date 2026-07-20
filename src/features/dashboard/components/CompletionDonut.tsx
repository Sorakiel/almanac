import { useEffect, useMemo, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface CompletionDonutProps {
  completed: number
  total: number
  /** Rendered diameter in px. The SVG geometry scales to fit. */
  size?: number
}

const VIEW = 160
const CENTER = VIEW / 2
const R_OUT = 74
const R_IN = 58
const TICKS = 36

/**
 * Radial completion gauge for today's habits — a ring of ticks rather than a
 * solid arc, keeping the block-bar / terminal language. Ticks fill in sequence
 * on mount (staggered colour transition) and the centre percentage counts up.
 */
export function CompletionDonut({ completed, total, size = 160 }: CompletionDonutProps) {
  const safeTotal = Math.max(total, 0)
  const pct = safeTotal === 0 ? 0 : Math.round((completed / safeTotal) * 100)

  // Precompute each tick's endpoints once; the ring is static geometry.
  const ticks = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, i) => {
        const a = ((-90 + (i * 360) / TICKS) * Math.PI) / 180
        return {
          x1: CENTER + R_IN * Math.cos(a),
          y1: CENTER + R_IN * Math.sin(a),
          x2: CENTER + R_OUT * Math.cos(a),
          y2: CENTER + R_OUT * Math.sin(a),
        }
      }),
    [],
  )

  // Start empty, then flip to the real ratio after first paint so ticks fill in.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct / 100))
    return () => cancelAnimationFrame(id)
  }, [pct])

  const filled = Math.round(shown * TICKS)
  const displayPct = useCountUp(pct)
  const big = size >= 140
  const perfect = safeTotal > 0 && pct === 100

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${completed} of ${total} habits complete, ${pct} percent`}
    >
      {/* Perfect day: a soft breathing halo behind the ring. */}
      {perfect ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full motion-safe:animate-soft-pulse"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--color-accent) / 0.35) 0%, transparent 68%)',
          }}
        />
      ) : null}
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="h-full w-full">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={5}
            strokeLinecap="butt"
            stroke={i < filled ? 'rgb(var(--color-accent))' : 'rgb(var(--color-border) / 0.16)'}
            className="transition-colors duration-300 motion-reduce:transition-none"
            style={{ transitionDelay: `${i * 12}ms` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-mono font-semibold tabular-nums', big ? 'text-3xl' : 'text-xl')}>
          {displayPct}%
        </span>
        <span className={cn('label-mono', big ? 'mt-1' : 'mt-0.5 text-[10px]')}>
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}
