import { Dumbbell } from 'lucide-react'
import type { SessionExercise, Workout } from '@/features/workouts/types'

interface WorkoutSessionRailProps {
  workout: Workout
  exercises: SessionExercise[]
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop rail for a workout session: progress and total volume lifted. */
export function WorkoutSessionRail({ workout, exercises }: WorkoutSessionRailProps) {
  const allSets = exercises.flatMap((e) => e.sets)
  const doneSets = allSets.filter((s) => s.done)
  const volume = doneSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-teal/15 text-teal"
        >
          <Dumbbell className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{workout.name}</p>
          <p className="font-mono text-[10px] text-muted-strong">
            {workout.completed_at ? 'completed' : 'in progress'}
          </p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">session</p>
        <div className="mt-2 flex flex-col">
          <Row label="exercises" value={String(exercises.length)} />
          <Row label="sets done" value={`${doneSets.length} / ${allSets.length}`} />
          <Row label="volume" value={`${Math.round(volume)} kg`} />
        </div>
      </div>

      <div className="rounded-[16px] border border-teal/25 bg-gradient-to-br from-teal/10 to-transparent p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-teal">tip</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Tick each set as you finish it — volume is reps × weight across completed sets.
        </p>
      </div>
    </div>
  )
}
