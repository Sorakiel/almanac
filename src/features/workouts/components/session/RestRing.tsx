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
  /** False while the session clock is paused. */
  running: boolean
  elapsedMs: number
  doneSets: number
  totalSets: number
  /** What comes after the rest, e.g. "подход 3 · 8 × 60 кг". */
  next: string | null
  className?: string
}

const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

/**
 * The session's one big number. Resting, it is the countdown, drained by an
 * accent ring, with the next set underneath — the two things you look up for
 * between sets. Working, it is the session clock, with a teal ring for the
 * share of sets done. The rest arc drains in one CSS animation per rest (see
 * DrainArc); the sets arc eases to each new share — no frame loop either way.
 */
export function RestRing({
  restMs,
  restTotalMs,
  restEndsAt,
  running,
  elapsedMs,
  doneSets,
  totalSets,
  next,
  className,
}: RestRingProps) {
  const { t } = useT()
  const resting = restMs !== null
  const ratio = resting
    ? Math.min(1, restMs / Math.max(restTotalMs, 1))
    : totalSets > 0
      ? doneSets / totalSets
      : 0
  const caption = resting
    ? t('workouts.session.resting')
    : running
      ? t('workouts.session.inProgress')
      : t('workouts.session.paused')

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
          {resting ? (
            <DrainArc
              key={`rest-${restEndsAt ?? 0}`}
              r={R}
              circumference={CIRCUMFERENCE}
              remainingMs={restMs}
              totalMs={restTotalMs}
              className="stroke-accent"
            />
          ) : (
            <circle
              key="sets"
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              // Its own element, keyed apart from the rest arc: one shared
              // circle used to sweep across the whole ring on every switch
              // between resting and working.
              style={{ strokeDashoffset: CIRCUMFERENCE * (1 - ratio) }}
              className="stroke-teal motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-sheet"
            />
          )}
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          role="timer"
          aria-label={caption}
        >
          <span className="num text-large-title font-semibold">
            {formatClock(resting ? restMs : elapsedMs)}
          </span>
          <span className="text-footnote text-muted">{caption}</span>
        </div>
      </div>
      {resting && next ? (
        <p className="max-w-full truncate text-callout text-muted">
          {t('workouts.session.next', { what: next })}
        </p>
      ) : null}
    </div>
  )
}
