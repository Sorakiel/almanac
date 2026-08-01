import { useNavigate } from 'react-router-dom'
import { Check, Dumbbell, Layers, Play, Timer, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/common/IconTile'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useWorkoutSessionStore } from '@/stores/workoutSession'
import { estimateMinutes, plannedVolume } from '@/features/workouts/lib/session'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import type { SessionExercise, WorkoutView } from '@/features/workouts/types'

interface TodaySessionCardProps {
  workout: WorkoutView
  /** Already completed on the selected day. */
  doneToday: boolean
  /** Where the selected day sits relative to today — only today can start. */
  dayState: 'today' | 'past' | 'future'
}

/** Unique muscle groups across the session, e.g. "CHEST · SHOULDERS". */
function muscleSummary(exercises: SessionExercise[]): string | null {
  const groups = [...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean))]
  return groups.length ? groups.join(' · ').toUpperCase() : null
}

function Meta({ icon: Icon, children }: { icon: typeof Layers; children: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[12.5px] tabular-nums text-muted">
      <Icon className="h-3.5 w-3.5 text-muted-strong" aria-hidden="true" />
      {children}
    </span>
  )
}

/** Right-aligned status tag for a non-today day. */
function DayStatus({ dayState, done }: { dayState: 'past' | 'future'; done: boolean }) {
  const text = done ? 'completed' : dayState === 'future' ? 'scheduled' : 'missed'
  const tone = done ? 'text-teal' : dayState === 'future' ? 'text-muted' : 'text-muted-strong'
  return <span className={`font-mono text-[10px] uppercase tracking-label ${tone}`}>{text}</span>
}

/** The selected day's session card — the warm spec-board "today" panel. */
export function TodaySessionCard({ workout, doneToday, dayState }: TodaySessionCardProps) {
  const navigate = useNavigate()
  const start = useWorkoutSessionStore((s) => s.start)
  const hasActiveSession = useWorkoutSessionStore((s) => Boolean(s.sessions[workout.id]))
  const { exercises } = useWorkoutDetail(workout.id)
  const hasPlan = exercises.length > 0
  const volume = plannedVolume(exercises)
  const overline = muscleSummary(exercises) ?? recurrenceLabel(workout)?.toUpperCase() ?? 'SESSION'
  const isToday = dayState === 'today'

  const openDetail = () => navigate(`/train/${workout.id}`)
  const startSession = () => {
    start(workout.id)
    navigate(`/train/${workout.id}/session`)
  }

  return (
    <div className="border-accent/28 rounded-[22px] border bg-gradient-to-br from-accent/[0.12] to-surface p-6 lg:p-7">
      {/* The card body previews the plan; the action button is separate below. */}
      <button
        type="button"
        onClick={openDetail}
        aria-label={`View ${workout.name} plan`}
        className="group block w-full text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
              {overline}
            </p>
            <h3 className="mt-2 truncate text-[22px] font-semibold tracking-title decoration-accent/40 underline-offset-4 group-hover:underline lg:text-[26px]">
              {workout.name}
            </h3>
          </div>
          <div className="flex flex-none items-center gap-3">
            {!isToday ? <DayStatus dayState={dayState} done={doneToday} /> : null}
            <IconTile icon={Dumbbell} tone="bg-accent/16 text-accent" size="lg" />
          </div>
        </div>

        {hasPlan ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <Meta icon={Layers}>{`${exercises.length} exercises`}</Meta>
            <Meta icon={Timer}>{`~${estimateMinutes(exercises)} min`}</Meta>
            {volume > 0 ? (
              <Meta icon={TrendingUp}>{`${volume.toLocaleString('en-US')} kg`}</Meta>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No exercises planned yet — add some to start a session.
          </p>
        )}
      </button>

      <div className="mt-5">
        {!isToday ? (
          <Button
            variant="surface"
            className="w-full sm:w-auto sm:min-w-[220px]"
            onClick={openDetail}
          >
            <Layers className="h-4 w-4" />
            View plan
          </Button>
        ) : !hasPlan ? (
          <Button
            variant="surface"
            className="w-full sm:w-auto sm:min-w-[220px]"
            onClick={openDetail}
          >
            <Layers className="h-4 w-4" />
            Plan session
          </Button>
        ) : hasActiveSession ? (
          <Button className="w-full shadow-glow sm:w-auto sm:min-w-[220px]" onClick={startSession}>
            <Play className="h-4 w-4 fill-current" />
            Resume session
          </Button>
        ) : doneToday ? (
          <Button
            variant="surface"
            className="w-full sm:w-auto sm:min-w-[220px]"
            onClick={startSession}
          >
            <Check className="h-4 w-4" />
            Done — train again
          </Button>
        ) : (
          <Button className="w-full shadow-glow sm:w-auto sm:min-w-[220px]" onClick={startSession}>
            <Play className="h-4 w-4" />
            Start session
          </Button>
        )}
      </div>
    </div>
  )
}
