import { Check } from 'lucide-react'
import { exerciseTargetLabel, isExerciseDone } from '@/features/workouts/lib/session'
import type { SessionExercise } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

interface SessionQueueProps {
  exercises: SessionExercise[]
  /** Index of the exercise currently in focus (excluded from both lists). */
  currentIndex: number
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-strong">{children}</p>
  )
}

function QueueCard({
  exercise,
  right,
  muted,
  dim,
}: {
  exercise: SessionExercise
  right: React.ReactNode
  muted?: boolean
  dim?: number
}) {
  const target = exerciseTargetLabel(exercise)
  return (
    <div
      style={dim !== undefined ? { opacity: dim } : undefined}
      className="flex items-center justify-between gap-3 rounded-2xl border bg-surface px-4 py-3.5"
    >
      <div className="min-w-0">
        <p className={cn('truncate text-[14.5px] font-medium', muted && 'text-muted')}>
          {exercise.name}
        </p>
        {target ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-strong">{target}</p>
        ) : null}
      </div>
      <span className="flex-none">{right}</span>
    </div>
  )
}

/** The session queue: exercises still ahead (Up Next) and finished ones (Done). */
export function SessionQueue({ exercises, currentIndex }: SessionQueueProps) {
  const upNext = exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise, index }) => index > currentIndex && !isExerciseDone(exercise))
  const done = exercises.filter(isExerciseDone)

  return (
    <div className="flex flex-col gap-6">
      {upNext.length > 0 ? (
        <section>
          <Eyebrow>up next</Eyebrow>
          <div className="mt-3 flex flex-col gap-2.5">
            {upNext.map(({ exercise, index }, i) => (
              <QueueCard
                key={exercise.id}
                exercise={exercise}
                dim={[1, 0.75, 0.55][i] ?? 0.45}
                right={
                  <span
                    className={cn(
                      'font-mono text-[10px] tabular-nums',
                      i === 0 ? 'text-accent' : 'text-muted-strong',
                    )}
                  >
                    {index + 1}/{exercises.length}
                  </span>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {done.length > 0 ? (
        <section>
          <Eyebrow>done</Eyebrow>
          <div className="mt-3 flex flex-col gap-2.5">
            {done.map((exercise) => (
              <QueueCard
                key={exercise.id}
                exercise={exercise}
                muted
                right={<Check className="h-4 w-4 text-accent" aria-hidden="true" />}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
