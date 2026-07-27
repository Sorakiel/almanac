import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { useExerciseLibrary } from '@/features/workouts/hooks/useExerciseLibrary'
import { createExercise } from '@/features/workouts/api/session.api'
import { draftSummary, volumeLabel, type WorkoutDraft } from '@/features/workouts/lib/draft'
import type { LibraryPick } from '@/features/workouts/hooks/useWorkoutDraft'
import { cn } from '@/lib/utils'

interface ExerciseLibraryRailProps {
  draft: WorkoutDraft
  onPick: (pick: LibraryPick) => void
  /** Set when replacing an existing exercise — shows a swap banner. */
  swapName?: string | null
  onCancelSwap?: () => void
}

/** Library browser + template summary — the right rail of the edit screen. */
export function ExerciseLibraryRail({
  draft,
  onPick,
  swapName,
  onCancelSwap,
}: ExerciseLibraryRailProps) {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const { exercises } = useExerciseLibrary()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const muscles = useMemo(
    () => [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))] as string[],
    [exercises],
  )
  const filtered = exercises.filter(
    (e) =>
      (!muscle || e.muscle_group === muscle) &&
      e.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const create = useMutation({
    mutationFn: (name: string) => createExercise(user?.id ?? '', name, muscle),
    onSuccess: (exercise) => {
      void queryClient.invalidateQueries({ queryKey: ['exerciseLibrary', user?.id ?? ''] })
      onPick({ exerciseId: exercise.id, name: exercise.name, muscleGroup: exercise.muscle_group })
      setNewName('')
      setCreating(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not create the exercise'),
  })

  const summary = draftSummary(draft)

  return (
    <div className="flex h-full flex-col gap-3.5">
      <p className="label-mono">// {swapName ? 'swap exercise' : 'add exercise'}</p>

      {swapName ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-[13px]">
          <span className="min-w-0 truncate">
            Replacing <span className="font-semibold">{swapName}</span>
          </span>
          <button
            type="button"
            onClick={onCancelSwap}
            aria-label="Cancel swap"
            className="flex-none text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-strong"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search library…"
          className="pl-9"
          aria-label="Search exercise library"
        />
      </div>

      {muscles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {muscles.map((m) => {
            const active = muscle === m
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => setMuscle(active ? null : m)}
                className={cn(
                  'rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-label transition-colors',
                  active ? 'border-accent bg-accent text-on-accent' : 'text-muted hover:text-foreground',
                )}
              >
                {m}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted">
            No matching exercises.
          </p>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-2xl border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{e.name}</p>
                {e.muscle_group ? (
                  <p className="truncate font-mono text-[10px] uppercase tracking-label text-muted-strong">
                    {e.muscle_group}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() =>
                  onPick({ exerciseId: e.id, name: e.name, muscleGroup: e.muscle_group })
                }
                aria-label={`${swapName ? 'Swap to' : 'Add'} ${e.name}`}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors hover:bg-accent hover:text-on-accent"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>

      {creating ? (
        <div className="flex flex-col gap-2 rounded-2xl border bg-surface p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New exercise name"
            aria-label="New exercise name"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={!newName.trim() || create.isPending}
              onClick={() => create.mutate(newName.trim())}
            >
              Create{muscle ? ` · ${muscle}` : ''}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 font-mono text-[12px] text-accent transition-colors hover:bg-accent/5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create a custom exercise
        </button>
      )}

      <div className="rounded-2xl border bg-surface p-4">
        <p className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
          template summary
        </p>
        <div className="mt-2 flex items-baseline gap-5">
          <SummaryStat value={String(summary.exercises)} label="exercises" />
          <SummaryStat value={String(summary.sets)} label="sets" />
          <SummaryStat value={volumeLabel(summary.volume)} label="volume" />
        </div>
      </div>
    </div>
  )
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-label text-muted-strong">{label}</p>
    </div>
  )
}
