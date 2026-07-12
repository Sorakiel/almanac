import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { TodayProgress } from '@/features/habits/components/TodayProgress'
import { useFocusStore } from '@/stores/focus'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface NowBlockProps {
  habits: HabitWithTodayLog[]
}

/**
 * The home screen's "now" slot: a live flow session when one is running,
 * otherwise today's habit-completion bar. As other timed activities (workouts,
 * reading) land they can surface here too.
 */
export function NowBlock({ habits }: NowBlockProps) {
  const { endsAt, durationMin, label } = useFocusStore()
  const running = endsAt !== null && durationMin !== null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  if (!running) {
    return habits.length > 0 ? <TodayProgress habits={habits} /> : null
  }

  const msLeft = Math.max(endsAt - now, 0)
  const minLeft = Math.ceil(msLeft / 60_000)
  const elapsedMin = durationMin - msLeft / 60_000

  return (
    <Link
      to="/flow"
      className="relative block overflow-hidden rounded-card border border-accent/25 bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent"
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="label-mono text-accent">◷ flow · in session</span>
          <span className="label-mono normal-case tabular-nums tracking-normal">
            {minLeft} min left
          </span>
        </div>
        <p className="truncate text-lg font-semibold tracking-title">{label ?? 'Focus session'}</p>
        <ProgressBlocks
          value={Math.round(elapsedMin * 10)}
          total={durationMin * 10}
          blocks={22}
          aria-label={`${minLeft} minutes left`}
        />
      </div>
    </Link>
  )
}
