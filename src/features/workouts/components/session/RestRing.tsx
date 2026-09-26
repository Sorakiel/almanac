import { DrainArc } from '@/features/workouts/components/session/DrainArc'
import { formatClock } from '@/features/workouts/lib/session'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface RestRingProps {
  /** Remaining rest in ms, or null when no rest countdown is running. */
  restMs: number | null
  /** Length of the rest that is counting down, in ms. */
  restTotalMs: number
  /** Identifies this rest, so a new one restarts the drain even at the same length. */
  restEndsAt: number | null
  /** What comes after the rest, e.g. "подход 3 · 8 × 60 кг". */
  next: string | null
  onSkip: () => void
  className?: string
}

// Geometry of the prototype's 56px ring (r 24, stroke 5) on the 120 viewBox
// DrainArc draws in.
const R = 51
const STROKE = 10.7
const CIRCUMFERENCE = 2 * Math.PI * R

/**
 * The rest card: a small draining ring, the countdown, what comes next and
 * Skip — the things you glance at between sets. Only while resting; working,
 * the "N of M" bar above says enough. The arc drains in one CSS animation per
 * rest (see DrainArc) — no frame loop.
 */
export function RestRing({
  restMs,
  restTotalMs,
  restEndsAt,
  next,
  onSkip,
  className,
}: RestRingProps) {
  const { t } = useT()
  if (restMs === null) return null

  return (
    <div className={cn('overflow-hidden rounded-card bg-surface', className)}>
      <div className="flex items-center gap-3.5 bg-teal/15 px-3.5 py-3">
        <svg viewBox="0 0 120 120" className="h-14 w-14 flex-none -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-teal/20"
          />
          <DrainArc
            key={`rest-${restEndsAt ?? 0}`}
            r={R}
            circumference={CIRCUMFERENCE}
            remainingMs={restMs}
            totalMs={restTotalMs}
            strokeWidth={STROKE}
            className="stroke-teal"
          />
        </svg>
        <div className="min-w-0 flex-1" role="timer" aria-label={t('workouts.session.resting')}>
          <span className="num block text-title font-medium tracking-tight">
            {formatClock(restMs)}
          </span>
          <span className="block truncate text-footnote text-muted">
            {next ? t('workouts.session.restThen', { what: next }) : t('workouts.session.resting')}
          </span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 flex-none rounded-full bg-accent/15 px-3.5 text-callout font-semibold text-accent transition-transform active:scale-95"
        >
          {t('workouts.session.skipRest')}
        </button>
      </div>
    </div>
  )
}
