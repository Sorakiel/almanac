import { Check } from 'lucide-react'
import { exerciseTargetLabel, isExerciseDone } from '@/features/workouts/lib/session'
import type { SessionExercise } from '@/features/workouts/types'

interface SessionQueueProps {
  exercises: SessionExercise[]
  /** Index of the exercise currently in focus (excluded from both lists). */
  currentIndex: number
}

function QueueRow({
  exercise,
  meta,
  done,
}: {
  exercise: SessionExercise
  meta: string
  done?: boolean
}) {
  const target = exerciseTargetLabel(exercise)
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">{exercise.name}</p>
        {target ? <p className="truncate text-xs text-muted">{target}</p> : null}
      </div>
      {done ? (
        <Check className="h-4 w-4 flex-none text-teal" aria-hidden="true" />
      ) : (
        <span className="flex-none font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {meta}
        </span>
      )}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">{label}</p>
      <div className="mt-1 divide-y divide-border/60">{children}</div>
    </div>
  )
}

/** The session queue: exercises still ahead, and the ones already finished. */
export function SessionQueue({ exercises, currentIndex }: SessionQueueProps) {
  const upNext = exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise, index }) => index > currentIndex && !isExerciseDone(exercise))
  const done = exercises.filter(isExerciseDone)

  return (
    <div className="flex flex-col gap-3">
      {upNext.length > 0 ? (
        <Group label="up next">
          {upNext.map(({ exercise, index }) => (
            <QueueRow
              key={exercise.id}
              exercise={exercise}
              meta={`${index + 1}/${exercises.length}`}
            />
          ))}
        </Group>
      ) : null}

      {done.length > 0 ? (
        <Group label="done">
          {done.map((exercise) => (
            <QueueRow key={exercise.id} exercise={exercise} meta="" done />
          ))}
        </Group>
      ) : null}
    </div>
  )
}
