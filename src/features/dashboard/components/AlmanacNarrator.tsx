import { useEffect, useMemo, useState } from 'react'
import { buildNarratorLines, type NarratorTone } from '@/features/dashboard/lib/narrator'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface AlmanacNarratorProps {
  habits: HabitWithTodayLog[]
}

const ROTATE_MS = 5500

// A terminal prompt glyph + text colour per tone.
const TONE: Record<NarratorTone, { glyph: string; className: string }> = {
  urgent: { glyph: '!', className: 'text-accent' },
  good: { glyph: '✓', className: 'text-teal' },
  info: { glyph: '>', className: 'text-muted-strong' },
}

/**
 * "The Almanac" narrator — a console readout that reads the day from the habit
 * data already on screen (no network) and rotates through its observations,
 * leading with the most actionable. Purely derived; see lib/narrator.
 */
export function AlmanacNarrator({ habits }: AlmanacNarratorProps) {
  const lines = useMemo(() => buildNarratorLines(habits), [habits])
  const [i, setI] = useState(0)

  useEffect(() => {
    if (lines.length <= 1) return
    const id = window.setInterval(() => setI((prev) => prev + 1), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [lines.length])

  const line = lines[i % lines.length]
  if (!line) return null
  const tone = TONE[line.tone]

  return (
    <div className="rounded-[18px] border border-accent/20 bg-surface p-[18px]">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 text-[13px] text-accent"
        >
          ◇
        </span>
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          the almanac // reading your day
        </p>
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

      {lines.length > 1 ? (
        <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
          {lines.map((l, idx) => (
            <span
              key={l.id}
              className={cn(
                'h-1 w-1 rounded-full transition-colors',
                idx === i % lines.length ? 'bg-accent' : 'bg-border/30',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
