import { useEffect, useRef, useState, type ReactElement } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InsightLine, InsightTone } from '@/lib/insight'

interface InsightTickerProps {
  /** Mono micro-label above the readout, e.g. "the almanac // reading your day". */
  title: string
  lines: InsightLine[]
}

const ROTATE_MS = 5500
// Manual interaction takes over; auto-rotation resumes after a quiet spell.
const RESUME_MS = 20000

// A terminal prompt glyph + text colour per tone.
const TONE: Record<InsightTone, { glyph: string; className: string }> = {
  urgent: { glyph: '!', className: 'text-accent' },
  good: { glyph: '✓', className: 'text-teal' },
  info: { glyph: '>', className: 'text-muted-strong' },
}

/**
 * Shared "console readout" primitive: rotates through rule-derived observations,
 * leading with the most actionable. Auto-advances when idle; any manual control
 * (dots, chevrons, or a tap on the card) jumps and pauses auto for a spell.
 * Purely presentational — each module feeds it its own line generator.
 */
export function InsightTicker({ title, lines }: InsightTickerProps): ReactElement | null {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const resumeRef = useRef<number | undefined>(undefined)

  const count = lines.length

  useEffect(() => {
    if (paused || count <= 1) return
    const id = window.setInterval(() => setI((prev) => prev + 1), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, count])

  // Drop any pending resume timer on unmount.
  useEffect(() => () => window.clearTimeout(resumeRef.current), [])

  if (count === 0) return null

  const active = ((i % count) + count) % count
  const line = lines[active]!
  const tone = TONE[line.tone]

  const pauseAuto = () => {
    setPaused(true)
    window.clearTimeout(resumeRef.current)
    resumeRef.current = window.setTimeout(() => setPaused(false), RESUME_MS)
  }
  const jump = (idx: number) => {
    pauseAuto()
    setI(((idx % count) + count) % count)
  }
  const step = (delta: number) => jump(active + delta)

  const multi = count > 1

  return (
    <div
      className={cn(
        'rounded-[18px] border border-accent/20 bg-surface p-[18px]',
        multi && 'cursor-pointer',
      )}
      onClick={multi ? () => step(1) : undefined}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 text-[13px] text-accent"
        >
          ◇
        </span>
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">{title}</p>
      </div>

      {/* keyed so each rotation re-runs the fade-in */}
      <p
        key={line.id}
        className="mt-3 min-h-[2.5em] font-mono text-[13px] leading-relaxed motion-safe:animate-in motion-safe:fade-in"
        aria-live="polite"
      >
        <span className={cn('font-bold', tone.className)}>{tone.glyph}</span>{' '}
        <span className="text-foreground">{line.text}</span>
      </p>

      {multi ? (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous observation"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            className="flex h-5 w-5 items-center justify-center rounded-md text-muted-strong transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <div className="flex flex-1 items-center gap-1.5">
            {lines.map((l, idx) => (
              <button
                key={l.id}
                type="button"
                aria-label={`Observation ${idx + 1} of ${count}`}
                aria-current={idx === active}
                onClick={(e) => {
                  e.stopPropagation()
                  jump(idx)
                }}
                className="group flex h-3 items-center"
              >
                <span
                  className={cn(
                    'h-1 w-1 rounded-full transition-colors group-hover:bg-accent/60',
                    idx === active ? 'bg-accent' : 'bg-border/40',
                  )}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next observation"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            className="flex h-5 w-5 items-center justify-center rounded-md text-muted-strong transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
