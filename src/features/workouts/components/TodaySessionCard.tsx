import { useNavigate } from 'react-router-dom'
import { Check, Dumbbell, Layers, Play, Timer, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/common/IconTile'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useWorkoutSessionStore } from '@/stores/workoutSession'
import { estimateMinutes, plannedVolume } from '@/features/workouts/lib/session'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import type { WorkoutView } from '@/features/workouts/types'
import type { SessionExercise } from '@/features/workouts/types'

interface TodaySessionCardProps {
  workout: WorkoutView
  /** Already completed on the current local day. */
  doneToday: boolean
}

/** Unique muscle groups across the session, e.g. "CHEST · SHOULDERS". */
function muscleSummary(exercises: SessionExercise[]): string | null {
  const groups = [...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean))]
  return groups.length ? groups.join(' · ').toUpperCase() : null
}

function Meta({ icon: Icon, children }: { icon: typeof Layers; children: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-muted">
      <Icon className="h-3.5 w-3.5 text-muted-strong" aria-hidden="true" />
      {children}
    </span>
  )
}

/** Today's due workout: a summary plus the one-tap entry into a live session. */
export function TodaySessionCard({ workout, doneToday }: TodaySessionCardProps) {
  const navigate = useNavigate()
  const start = useWorkoutSessionStore((s) => s.start)
  const { exercises } = useWorkoutDetail(workout.id)
  const hasPlan = exercises.length > 0
  const volume = plannedVolume(exercises)
  const overline = muscleSummary(exercises) ?? recurrenceLabel(workout)?.toUpperCase() ?? 'SESSION'

  const startSession = () => {
    start(workout.id)
    navigate(`/train/${workout.id}/session`)
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
            {overline}
          </p>
          <h3 className="mt-1 truncate text-xl font-semibold tracking-title">{workout.name}</h3>
        </div>
        {doneToday ? (
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-label text-teal">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            done
          </span>
        ) : null}
      </div>

      {hasPlan ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Meta icon={Layers}>{`${exercises.length} exercises`}</Meta>
          <Meta icon={Timer}>{`~${estimateMinutes(exercises)} min`}</Meta>
          {volume > 0 ? <Meta icon={TrendingUp}>{`${volume.toLocaleString('en-US')} kg`}</Meta> : null}
        </div>
      ) : (
        <p className="text-sm text-muted">No exercises planned yet — add some to start a session.</p>
      )}

      {!hasPlan ? (
        <Button variant="surface" size="lg" onClick={() => navigate(`/train/${workout.id}`)}>
          <Layers className="h-4 w-4" />
          Plan session
        </Button>
      ) : doneToday ? (
        <Button variant="surface" size="lg" onClick={startSession}>
          <Play className="h-4 w-4" />
          Train again
        </Button>
      ) : (
        <Button size="lg" className="shadow-glow" onClick={startSession}>
          <Play className="h-4 w-4" />
          Start session
        </Button>
      )}
    </Card>
  )
}
