import { useMemo } from 'react'
import { Check, X } from 'lucide-react'

interface FocusConsoleProps {
  label: string
  msLeft: number
  durationMin: number
  /** Fractional minutes elapsed. */
  elapsedMin: number
  pct: number
  onEnd: () => void
  /** Omit to hide the complete action (workout/book sessions end via their runner). */
  onComplete?: () => void
  completeLabel?: string
}

const VIEW = 220
const C = VIEW / 2
const R_OUT = 96
const R_IN = 80
const TICKS = 48
const BLOCKS = 22

/** mm:ss from milliseconds. */
function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * The running-session visualizer: a terminal "radar" orb — a segmented ring
 * that fills with progress, a sweeping wedge, a pulsing core, a mono countdown
 * with a live caret, and a scrolling scanline. Deliberately console/SkyNet, not
 * a calm meditation orb.
 */
export function FocusConsole({
  label,
  msLeft,
  durationMin,
  elapsedMin,
  pct,
  onEnd,
  onComplete,
  completeLabel = 'Done',
}: FocusConsoleProps) {
  const ticks = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, i) => {
        const a = ((-90 + (i * 360) / TICKS) * Math.PI) / 180
        return {
          x1: C + R_IN * Math.cos(a),
          y1: C + R_IN * Math.sin(a),
          x2: C + R_OUT * Math.cos(a),
          y2: C + R_OUT * Math.sin(a),
        }
      }),
    [],
  )
  const filled = Math.round((pct / 100) * TICKS)
  const onBlocks = Math.round((pct / 100) * BLOCKS)
  const bar = '▓'.repeat(onBlocks) + '░'.repeat(BLOCKS - onBlocks)

  return (
    <div className="relative overflow-hidden rounded-card border border-accent/25 bg-bg-deep p-6 lg:p-8">
      {/* Static CRT scanlines + one gliding highlight line. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(var(--color-accent)) 0 1px, transparent 1px 3px)',
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent/10 to-transparent motion-safe:animate-scanline"
      />

      <div className="relative flex flex-col items-center gap-5">
        <p className="w-full font-mono text-[10px] uppercase tracking-label text-accent">
          ▷ focus.session // active
        </p>

        <div className="relative h-[220px] w-[220px]">
          {/* Pulsing core glow. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:animate-soft-pulse"
            style={{
              background:
                'radial-gradient(circle, rgb(var(--color-accent) / 0.28), transparent 70%)',
            }}
          />
          {/* Rotating radar wedge, clipped to the orb. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full motion-safe:animate-radar-sweep"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgb(var(--color-accent) / 0.20) 46deg, transparent 52deg)',
            }}
          />
          <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="relative h-full w-full">
            <circle
              cx={C}
              cy={C}
              r={R_IN - 12}
              fill="none"
              stroke="rgb(var(--color-accent) / 0.12)"
            />
            <circle
              cx={C}
              cy={C}
              r={R_IN - 34}
              fill="none"
              stroke="rgb(var(--color-accent) / 0.1)"
            />
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                strokeWidth={4}
                stroke={i < filled ? 'rgb(var(--color-accent))' : 'rgb(var(--color-border) / 0.15)'}
                className="transition-colors duration-500"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-semibold tabular-nums lg:text-5xl">
              {clock(msLeft)}
            </span>
            <span className="mt-1.5 font-mono text-[13px] uppercase tracking-label text-muted lg:text-sm">
              {pct}% · {Math.max(0, Math.ceil(msLeft / 60_000))}m left
            </span>
          </div>
        </div>

        {/* Terminal readout. */}
        <div className="w-full space-y-1 rounded-[16px] border border-accent/15 bg-bg/50 p-4 font-mono text-[13px] leading-relaxed text-muted lg:p-5 lg:text-[15px]">
          <p className="truncate">
            <span className="text-accent">$</span> target{' '}
            <span className="text-foreground">{label}</span>
          </p>
          <p>
            <span className="text-accent">$</span> elapsed{' '}
            <span className="tabular-nums text-foreground">{clock(elapsedMin * 60_000)}</span> /{' '}
            {String(durationMin).padStart(2, '0')}:00
          </p>
          <p className="text-accent">
            [{bar}] {pct}%
          </p>
        </div>

        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={onEnd}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[11px] border bg-surface py-2.5 font-mono text-[11px] font-bold uppercase tracking-label text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            End
          </button>
          {onComplete ? (
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-accent py-2.5 font-mono text-[11px] font-bold uppercase tracking-label text-on-accent transition-colors hover:bg-accent-deep hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {completeLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
