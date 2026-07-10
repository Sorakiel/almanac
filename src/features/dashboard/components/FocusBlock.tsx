import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { useFocusStore } from '@/stores/focus'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

const DURATIONS_MIN = [15, 25, 45]

interface FocusBlockProps {
  habits: HabitWithTodayLog[]
}

/**
 * The "NOW · FOCUS" card — a timeboxed focus mode (spec board 01). Focus is
 * not a habit: starting a session only starts a timer; habits are completed
 * separately in the list below.
 */
export function FocusBlock({ habits }: FocusBlockProps) {
  const { endsAt, durationMin, label, start, stop } = useFocusStore()
  const [duration, setDuration] = useState(25)
  const [now, setNow] = useState(() => Date.now())

  const running = endsAt !== null && durationMin !== null
  // Resting interval habits don't count against today.
  const dueHabits = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = dueHabits.filter((h) => h.isComplete).length
  const nextHabit = dueHabits.find((h) => !h.isComplete)

  // 1 Hz tick while a session runs; also catches sessions that expired offline.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (running && endsAt - now <= 0) {
      stop()
      toast.success('Focus session complete — nice work.')
    }
  }, [running, endsAt, now, stop])

  const msLeft = running ? Math.max(endsAt - now, 0) : 0
  const minLeft = Math.ceil(msLeft / 60_000)
  const elapsedMin = running ? durationMin - msLeft / 60_000 : 0

  return (
    <div className="relative overflow-hidden rounded-card border border-accent/25 bg-surface p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent"
      />
      <div className="relative">
        <p className="label-mono text-accent">
          {running ? 'FOCUS · IN SESSION' : `FOCUS · ${completed} OF ${dueHabits.length} DONE`}
        </p>
        <p className="mt-2 text-xl font-semibold tracking-title">
          {running ? (label ?? 'Focus session') : (nextHabit?.name ?? 'All done today 🎉')}
        </p>

        {running ? (
          <>
            <div className="mt-4 flex items-center gap-3">
              <ProgressBlocks
                value={Math.round(elapsedMin * 10)}
                total={durationMin * 10}
                aria-label={`${minLeft} minutes left`}
              />
              <span className="label-mono normal-case tracking-normal tabular-nums text-foreground">
                {Math.round((elapsedMin / durationMin) * 100)}%
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="label-mono">◷ {minLeft} min left</span>
              <Button size="sm" onClick={stop}>
                <Check className="h-4 w-4" />
                Done
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-1.5" role="radiogroup" aria-label="Focus length">
              {DURATIONS_MIN.map((min) => (
                <button
                  key={min}
                  type="button"
                  role="radio"
                  aria-checked={duration === min}
                  onClick={() => setDuration(min)}
                  className={cn(
                    'rounded-pill border px-3 py-1.5 font-mono text-[11px] tracking-label transition-colors',
                    duration === min
                      ? 'border-accent/50 bg-accent/15 text-accent'
                      : 'text-muted hover:text-foreground',
                  )}
                >
                  {min}m
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => start(duration, nextHabit?.name)}>
              Start focus
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
