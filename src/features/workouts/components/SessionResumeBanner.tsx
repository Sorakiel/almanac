import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Timer } from 'lucide-react'
import { sessionElapsed, useWorkoutSessionStore } from '@/stores/workoutSession'
import { formatClock } from '@/features/workouts/lib/session'
import type { WorkoutView } from '@/features/workouts/types'

interface SessionResumeBannerProps {
  workouts: WorkoutView[]
}

/**
 * Surfaces a live (or paused) session started earlier so the user can jump back
 * in after navigating away. Renders nothing when no session is in progress.
 */
export function SessionResumeBanner({ workouts }: SessionResumeBannerProps) {
  const navigate = useNavigate()
  const sessions = useWorkoutSessionStore((s) => s.sessions)
  const start = useWorkoutSessionStore((s) => s.start)
  const [now, setNow] = useState(() => Date.now())

  const entry = Object.entries(sessions).find(([id]) => workouts.some((w) => w.id === id))
  const running = Boolean(entry?.[1].startedAt)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  if (!entry) return null
  const [workoutId, recordState] = entry
  const workout = workouts.find((w) => w.id === workoutId)
  if (!workout) return null

  const resume = () => {
    start(workoutId)
    navigate(`/train/${workoutId}/session`)
  }

  return (
    <button
      type="button"
      onClick={resume}
      className="flex w-full items-center gap-3 rounded-[18px] border border-accent/30 bg-gradient-to-r from-accent/[0.12] to-surface px-4 py-3 text-left transition-colors hover:border-accent/50"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent"
      >
        <Timer className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-label text-accent">
          {recordState.startedAt ? 'session in progress' : 'session paused'}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold">
          {workout.name}
          <span className="ml-2 font-mono text-xs font-normal tabular-nums text-muted">
            {formatClock(sessionElapsed(recordState, now))}
          </span>
        </p>
      </div>
      <span className="flex flex-none items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-on-accent">
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        Resume
      </span>
    </button>
  )
}
