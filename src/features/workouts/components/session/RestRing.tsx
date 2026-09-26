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
  className?: string
}

const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

/**
 * The rest countdown, drained by an accent ring, with the next set underneath —
 * the two things you look up for between sets. Only while resting: working,
 * the compact "N of M" bar above says enough, and a big ring with nothing to
 * count read as broken. The arc drains in one CSS animation per rest (see
 * DrainArc) — no frame loop.
 */
export function RestRing({ restMs, restTotalMs, restEndsAt, next, className }: RestRingProps) {
  const { t } = useT()
  if (restMs === null) return null

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative h-56 w-56 lg:h-64 lg:w-64">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="7"
            className="stroke-foreground/10"
          />
          <DrainArc
            key={`rest-${restEndsAt ?? 0}`}
            r={R}
            circumference={CIRCUMFERENCE}
            remainingMs={restMs}
            totalMs={restTotalMs}
            className="stroke-accent"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          role="timer"
          aria-label={t('workouts.session.resting')}
        >
          <span className="num text-large-title font-semibold">{formatClock(restMs)}</span>
          <span className="text-footnote text-muted">{t('workouts.session.resting')}</span>
        </div>
      </div>
      {next ? (
        <p className="max-w-full truncate text-callout text-muted">
          {t('workouts.session.next', { what: next })}
        </p>
      ) : null}
    </div>
  )
}
