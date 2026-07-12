import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import type { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import type { Exercise } from '@/features/workouts/types'

interface AddExerciseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Position for the new exercise (append to the end). */
  sortOrder: number
  library: Exercise[]
  mutations: ReturnType<typeof useSessionMutations>
}

function parseNum(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const FIELD = 'h-11 rounded-[11px] border bg-surface text-center text-sm tabular-nums'

/** Add an exercise to a workout — reuse a saved one or create a new one. */
export function AddExerciseSheet({
  open,
  onOpenChange,
  sortOrder,
  library,
  mutations,
}: AddExerciseSheetProps) {
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name the exercise')
      return
    }
    setPending(true)
    try {
      // Reuse a saved exercise with the same name, else create it.
      const existing = library.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
      const exercise =
        existing ??
        (await mutations.createLibraryExercise.mutateAsync({
          name: trimmed,
          muscleGroup: muscle.trim() || null,
        }))
      await mutations.addExercise.mutateAsync({
        exerciseId: exercise.id,
        sortOrder,
        targetSets: parseNum(sets),
        targetReps: parseNum(reps),
        targetWeight: parseNum(weight),
      })
      toast.success(`${exercise.name} added`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add the exercise')
    } finally {
      setPending(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add exercise"
      description="Pick a saved exercise or type a new one."
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Exercise</span>
          <Input
            list="exercise-library"
            placeholder="e.g. Bench press"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <datalist id="exercise-library">
            {library.map((e) => (
              <option key={e.id} value={e.name} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Muscle group (optional)</span>
          <Input
            placeholder="e.g. Chest"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="label-mono">Target (optional)</span>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="sets"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className={FIELD}
            />
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className={FIELD}
            />
            <input
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>

        <Button size="lg" onClick={submit} disabled={pending}>
          {pending ? 'Adding…' : 'Add exercise'}
        </Button>
      </div>
    </Sheet>
  )
}
