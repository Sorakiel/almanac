import { useEffect, useMemo, useRef } from 'react'
import { DEFAULT_REST_SECONDS, formatClock } from '@/features/workouts/lib/session'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

interface SessionPulseProps {
  /** False while the session clock is paused. */
  running: boolean
  /** Remaining rest in ms, or null when no rest countdown is running. */
  restMs: number | null
  doneSets: number
  totalSets: number
  elapsedMs: number
  className?: string
}

type PulseMode = 'working' | 'recovery' | 'paused' | 'complete'

const VIEW_W = 1000
const VIEW_H = 200
const MID = VIEW_H / 2
/** Points drawn across the strip; one extra on each side so the scroll wraps cleanly. */
const SAMPLES = 190
const SAMPLE_MS = 36
const STEP = VIEW_W / (SAMPLES - 1)
const POINTS = SAMPLES + 2
const SPIKE_MS = 460
/** Most samples one frame may advance, so a resumed tab doesn't flatten the strip. */
const MAX_CATCHUP = 4

const MODE_LABEL: Record<PulseMode, string> = {
  working: 'under load',
  recovery: 'recovering',
  paused: 'paused',
  complete: 'session complete',
}

/**
 * Baseline trace for a mode, in ±1 units of half-height.
 * `restRatio` is 1 at the top of a rest window and 0 when it runs out, so the
 * recovery wave visibly settles as the clock drains.
 */
function wave(mode: PulseMode, t: number, restRatio: number): number {
  switch (mode) {
    case 'working': {
      // A sharpened sine reads as effort — fuller crests, quicker crossings —
      // with a fine tremor riding on top so it never looks machine-generated.
      const s = Math.sin(t / 250)
      const lobe = Math.sign(s) * Math.abs(s) ** 0.55
      return 0.5 * lobe + 0.1 * Math.sin(t / 61) + 0.05 * Math.sin(t / 23)
    }
    case 'recovery':
      return (0.16 + 0.32 * restRatio) * Math.sin(t / 780) + 0.05 * Math.sin(t / 210)
    case 'complete':
      return 0.26 * Math.sin(t / 620) + 0.06 * Math.sin(t / 180)
    default:
      return 0.05 * Math.sin(t / 1100)
  }
}

/** Logged-set stamp: a short dip, a tall peak, a settling dip. `p` runs 0→1. */
function spike(p: number): number {
  if (p <= 0 || p >= 1) return 0
  if (p < 0.16) return -0.22 * Math.sin((p / 0.16) * Math.PI)
  if (p < 0.46) return 0.95 * Math.sin(((p - 0.16) / 0.3) * Math.PI)
  if (p < 0.78) return -0.34 * Math.sin(((p - 0.46) / 0.32) * Math.PI)
  return 0
}

function pathFrom(buffer: number[]): string {
  let d = ''
  buffer.forEach((v, i) => {
    const x = (i * STEP - STEP).toFixed(1)
    const y = (MID - v * MID).toFixed(1)
    d += `${i === 0 ? 'M' : 'L'}${x} ${y}`
  })
  return d
}

/**
 * The live-session visualizer: an effort trace scrolling right-to-left like a
 * gym monitor. It runs tight and spiky under load, calms down through a rest
 * window, flatlines while paused — and every logged set stamps a peak that then
 * scrolls away as session history. Counterpart to the flow radar, not a copy.
 */
export function SessionPulse({
  running,
  restMs,
  doneSets,
  totalSets,
  elapsedMs,
  className,
}: SessionPulseProps) {
  const { t } = useT()
  const mode: PulseMode =
    totalSets > 0 && doneSets >= totalSets
      ? 'complete'
      : !running
        ? 'paused'
        : restMs !== null
          ? 'recovery'
          : 'working'

  const reduced = useMemo(() => prefersReducedMotion(), [])
  const traceRef = useRef<SVGPathElement>(null)
  const areaRef = useRef<SVGPathElement>(null)
  const shiftRef = useRef<SVGGElement>(null)
  // The animation loop reads live values through refs so prop churn (the 1 Hz
  // clock) never restarts it.
  const modeRef = useRef(mode)
  const restRef = useRef(restMs)
  const spikeAtRef = useRef(-Infinity)
  useEffect(() => {
    modeRef.current = mode
    restRef.current = restMs
  }, [mode, restMs])

  // A newly ticked set stamps a peak into the trace.
  const lastDoneRef = useRef(doneSets)
  useEffect(() => {
    if (doneSets > lastDoneRef.current) spikeAtRef.current = performance.now()
    lastDoneRef.current = doneSets
  }, [doneSets])

  useEffect(() => {
    const buffer = new Array<number>(POINTS).fill(0)

    if (reduced) {
      // One representative still frame — a calm trace with a single stamped set.
      for (let i = 0; i < POINTS; i += 1) {
        const t = i * SAMPLE_MS
        buffer[i] = wave('recovery', t, 0.5) + spike((i - POINTS * 0.6) / (SPIKE_MS / SAMPLE_MS))
      }
      traceRef.current?.setAttribute('d', pathFrom(buffer))
      areaRef.current?.setAttribute(
        'd',
        `${pathFrom(buffer)}L${VIEW_W} ${VIEW_H}L${-STEP} ${VIEW_H}Z`,
      )
      return
    }

    let raf = 0
    let last = performance.now()
    let acc = 0

    const sample = (now: number) => {
      const restRatio =
        restRef.current === null ? 0 : Math.min(1, restRef.current / (DEFAULT_REST_SECONDS * 1000))
      const base = wave(modeRef.current, now, restRatio)
      const stamped = spike((now - spikeAtRef.current) / SPIKE_MS)
      // The stamp takes the trace over rather than adding to it, so its peak
      // stays a clean, unclipped shape whatever the baseline was doing.
      const blend = Math.min(1, Math.abs(stamped))
      buffer.shift()
      buffer.push(base * (1 - blend) + stamped)
    }

    const frame = (now: number) => {
      acc += now - last
      last = now
      // A backgrounded tab resumes with a huge delta; catching up sample by
      // sample would flood the strip with one repeated value, so drop the debt.
      if (acc > SAMPLE_MS * MAX_CATCHUP) acc = SAMPLE_MS * MAX_CATCHUP
      while (acc >= SAMPLE_MS) {
        acc -= SAMPLE_MS
        sample(now)
      }
      const d = pathFrom(buffer)
      traceRef.current?.setAttribute('d', d)
      areaRef.current?.setAttribute('d', `${d}L${VIEW_W} ${VIEW_H}L${-STEP} ${VIEW_H}Z`)
      // Sub-sample offset: the strip glides instead of stepping once per sample.
      shiftRef.current?.setAttribute('transform', `translate(${-(acc / SAMPLE_MS) * STEP} 0)`)
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const dim = mode === 'paused'
  const stroke = dim ? 'rgb(var(--color-muted-strong))' : 'rgb(var(--color-accent))'
  const tempo = doneSets > 0 ? formatClock(Math.round(elapsedMs / doneSets)) : '—:—'

  return (
    <section
      aria-label={t('workouts.session.effortTrace')}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-card border border-accent/20 bg-bg-deep',
        className,
      )}
    >
      {/* Monitor grid — CSS so it never distorts with the stretched viewBox. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(var(--color-border)) 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, rgb(var(--color-border)) 0 1px, transparent 1px 26px)',
        }}
      />

      <div className="relative flex items-center justify-between gap-3 px-4 pt-3.5 lg:px-6 lg:pt-5">
        <p
          className={cn(
            'font-mono text-[10px] uppercase tracking-label',
            dim ? 'text-muted-strong' : 'text-accent',
          )}
        >
          ▷ session.pulse // {MODE_LABEL[mode]}
        </p>
        {/* Redundant with the rest chip in the action bar on narrow screens. */}
        {restMs !== null ? (
          <p className="hidden font-mono text-[10px] uppercase tabular-nums tracking-label text-accent sm:block">
            rest {formatClock(restMs)}
          </p>
        ) : null}
      </div>

      <div className="relative min-h-[64px] flex-1">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="session-pulse-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: stroke, stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: stroke, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <line
            x1={0}
            y1={MID}
            x2={VIEW_W}
            y2={MID}
            strokeDasharray="2 10"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: 'rgb(var(--color-border))', strokeOpacity: 0.25 }}
          />
          <g ref={shiftRef}>
            <path ref={areaRef} fill="url(#session-pulse-fill)" />
            <path
              ref={traceRef}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{
                stroke,
                filter: dim ? undefined : `drop-shadow(0 0 6px rgb(var(--color-accent) / 0.55))`,
              }}
            />
          </g>
        </svg>
        {/* The writing head, pinned to the live edge of the trace. */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-0 top-0 h-full w-px',
            dim ? 'bg-muted-strong/30' : 'bg-accent/40',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-[-3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full',
            dim ? 'bg-muted-strong' : 'bg-accent shadow-glow motion-safe:animate-soft-pulse',
          )}
        />
      </div>

      <div className="relative flex items-center justify-between gap-3 px-4 pb-3.5 font-mono text-[10px] uppercase tracking-label text-muted-strong lg:px-6 lg:pb-5">
        <span className="tabular-nums">
          sets {doneSets}/{totalSets}
        </span>
        {/* The top bar already carries the elapsed clock on narrow screens. */}
        <span className="hidden tabular-nums sm:inline">elapsed {formatClock(elapsedMs)}</span>
        <span className="tabular-nums">{tempo} / set</span>
      </div>
    </section>
  )
}
