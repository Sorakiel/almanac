import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, Dumbbell, GripVertical, Repeat2, Trash2 } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { SetEditorTable } from '@/features/workouts/components/edit/SetEditorTable'
import { exerciseSubtitle, setsChip, type DraftExercise, type DraftSet } from '@/features/workouts/lib/draft'
import { cn } from '@/lib/utils'

interface DraftExerciseRowProps {
  exercise: DraftExercise
  expanded: boolean
  onToggle: () => void
  onSwap: () => void
  onRemove: () => void
  onEditSet: (setId: string, patch: Partial<Omit<DraftSet, 'id'>>) => void
  onStepSet: (setId: string, field: 'reps' | 'weight', delta: number) => void
  onRemoveSet: (setId: string) => void
  onAddSet: () => void
}

/** A draggable exercise: a collapsed summary row that expands into the set editor. */
export function DraftExerciseRow({
  exercise,
  expanded,
  onToggle,
  onSwap,
  onRemove,
  onEditSet,
  onStepSet,
  onRemoveSet,
  onAddSet,
}: DraftExerciseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })
  const chip = setsChip(exercise)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-[20px] border transition-colors',
        expanded
          ? 'border-accent/40 bg-gradient-to-br from-accent/[0.08] to-surface p-4 lg:p-5'
          : 'bg-surface p-3.5 lg:p-4',
        isDragging && 'relative z-10 opacity-80 shadow-card',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Reorder ${exercise.name}`}
          className="flex-none cursor-grab touch-none text-muted-strong hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>
        <IconTile icon={Dumbbell} tone="bg-accent/16 text-accent" size="sm" />
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="truncate font-semibold">{exercise.name}</p>
          <p className="truncate font-mono text-[11px] text-muted-strong">
            {exerciseSubtitle(exercise)}
          </p>
        </button>

        {expanded ? (
          <>
            <button
              type="button"
              onClick={onSwap}
              className="flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:text-foreground"
            >
              <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
              Swap
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${exercise.name}`}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-strong transition-colors hover:text-accent"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            {chip ? (
              <span className="flex-none rounded-lg border bg-bg px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted">
                {chip}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onToggle}
              aria-label={`Expand ${exercise.name}`}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-strong transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {expanded ? (
        <SetEditorTable
          exercise={exercise}
          onEditSet={onEditSet}
          onStepSet={onStepSet}
          onRemoveSet={onRemoveSet}
          onAddSet={onAddSet}
        />
      ) : null}
    </li>
  )
}
