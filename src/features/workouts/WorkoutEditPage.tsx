import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Loader2, Plus, Timer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { Rail } from '@/components/common/desktop/rail'
import { DraftExerciseRow } from '@/features/workouts/components/edit/DraftExerciseRow'
import { ExerciseLibraryRail } from '@/features/workouts/components/edit/ExerciseLibraryRail'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useWorkoutDraft, type LibraryPick } from '@/features/workouts/hooks/useWorkoutDraft'
import { estimateMinutes, muscleSummary } from '@/features/workouts/lib/draft'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useBreadcrumbLeaf } from '@/stores/breadcrumb'
import type { SessionExercise } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'

/** Draft editor, mounted only once the workout has loaded (stable snapshot). */
function DraftEditor({
  workoutId,
  name,
  exercises,
}: {
  workoutId: string
  name: string
  exercises: SessionExercise[]
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { draft, isDirty, actions, saveDraft, isSaving } = useWorkoutDraft(
    workoutId,
    name,
    exercises,
  )
  const [expandedId, setExpandedId] = useState<string | null>(exercises[0]?.id ?? null)
  const [swappingId, setSwappingId] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = draft.exercises.findIndex((e) => e.id === active.id)
    const to = draft.exercises.findIndex((e) => e.id === over.id)
    if (from >= 0 && to >= 0) actions.reorder(from, to)
  }

  const swapName = swappingId
    ? (draft.exercises.find((e) => e.id === swappingId)?.name ?? null)
    : null

  const handlePick = (pick: LibraryPick) => {
    if (swappingId) {
      actions.swapExercise(swappingId, pick)
      setSwappingId(null)
    } else {
      actions.addExercise(pick)
    }
    setLibraryOpen(false)
  }

  const startSwap = (id: string) => {
    setSwappingId(id)
    if (!isDesktop) setLibraryOpen(true)
  }

  const save = () =>
    saveDraft(() => {
      toast.success(t('workouts.editor.saved'))
      navigate(`/train/${workoutId}`)
    })

  const cancel = () => (isDirty ? setDiscardOpen(true) : navigate(`/train/${workoutId}`))

  const exerciseList = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext
        items={draft.exercises.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-3">
          {draft.exercises.map((ex) => (
            <DraftExerciseRow
              key={ex.id}
              exercise={ex}
              expanded={expandedId === ex.id}
              onToggle={() => setExpandedId((cur) => (cur === ex.id ? null : ex.id))}
              onSwap={() => startSwap(ex.id)}
              onRemove={() => actions.removeExercise(ex.id)}
              onEditSet={(setId, patch) => actions.editSet(ex.id, setId, patch)}
              onStepSet={(setId, field, delta) => actions.bumpSet(ex.id, setId, field, delta)}
              onRemoveSet={(setId) => actions.removeSet(ex.id, setId)}
              onAddSet={() => actions.addSet(ex.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )

  const emptyExercises = (
    <p className="rounded-[20px] border border-dashed bg-surface/40 px-4 py-10 text-center text-sm text-muted">
      {t('workouts.editor.empty')}
    </p>
  )

  const nameField = (
    <input
      value={draft.name}
      onChange={(e) => actions.setName(e.target.value)}
      aria-label={t('workouts.editor.name')}
      placeholder={t('workouts.editor.name')}
      className="w-full rounded-[14px] border bg-surface px-4 py-3 text-2xl font-semibold tracking-title focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  )

  const discardSheet = (
    <ConfirmSheet
      open={discardOpen}
      onOpenChange={setDiscardOpen}
      title={t('workouts.editor.discardTitle')}
      description={t('workouts.editor.discardHint')}
      confirmLabel={t('workouts.editor.discard')}
      onConfirm={() => navigate(`/train/${workoutId}`)}
    />
  )

  // ---- Desktop ----
  if (isDesktop) {
    return (
      <>
        <div className="mx-auto w-full max-w-[900px]">
          <p className="label-mono">// train / edit template</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="min-w-0 max-w-[520px] flex-1">{nameField}</div>
            <div className="flex flex-none gap-2">
              <Button variant="surface" onClick={cancel}>
                {t('workouts.editor.cancel')}
              </Button>
              <Button className="shadow-glow" disabled={!isDirty || isSaving} onClick={save}>
                {isSaving ? t('workouts.editor.saving') : t('workouts.editor.save')}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {muscleSummary(draft) ? (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-accent">
                {muscleSummary(draft)}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] tabular-nums text-muted">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />~{estimateMinutes(draft)} min
            </span>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <p className="label-mono">
              ◇ {t('workouts.editor.exercisesCount')} ·{' '}
              <span className="text-foreground">{draft.exercises.length}</span>
            </p>
            <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
              {t('workouts.editor.dragToReorder')}
            </span>
          </div>
          <div className="mt-3">{draft.exercises.length === 0 ? emptyExercises : exerciseList}</div>
        </div>

        <Rail>
          <ExerciseLibraryRail
            draft={draft}
            onPick={handlePick}
            swapName={swapName}
            onCancelSwap={() => setSwappingId(null)}
          />
        </Rail>
        {discardSheet}
      </>
    )
  }

  // ---- Mobile ----
  return (
    <section className="flex flex-col gap-4 pb-24">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={cancel}
          aria-label={t('workouts.editor.cancelEditing')}
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-label text-muted"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {t('workouts.editor.editWorkout')}
        </button>
        <Button size="sm" disabled={!isDirty || isSaving} onClick={save}>
          {isSaving ? t('workouts.editor.saving') : t('workouts.editor.saveShort')}
        </Button>
      </header>

      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {t('workouts.editor.workoutNameLower')}
        </p>
        {nameField}
      </div>

      <div className="flex items-center justify-between">
        <p className="label-mono">
          ◇ {t('workouts.editor.exercisesCount')} ·{' '}
          <span className="text-foreground">{draft.exercises.length}</span>
        </p>
        <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {t('workouts.editor.dragToReorder')}
        </span>
      </div>
      {draft.exercises.length === 0 ? emptyExercises : exerciseList}

      <Button
        size="lg"
        className="w-full border border-accent/50 bg-accent/10 text-accent hover:bg-accent/15"
        onClick={() => {
          setSwappingId(null)
          setLibraryOpen(true)
        }}
      >
        <Plus className="h-4 w-4" />
        {t('workouts.editor.addExercise')}
      </Button>

      <Sheet
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        title={swapName ? t('workouts.editor.swapExercise') : t('workouts.editor.addExercise')}
        mono
      >
        <div className="max-h-[70vh]">
          <ExerciseLibraryRail
            draft={draft}
            onPick={handlePick}
            swapName={swapName}
            onCancelSwap={() => setSwappingId(null)}
          />
        </div>
      </Sheet>
      {discardSheet}
    </section>
  )
}

/** Route wrapper: load the workout, then hand a stable snapshot to the editor. */
function WorkoutEditPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { workout, exercises, isLoading, isError } = useWorkoutDetail(id)
  useBreadcrumbLeaf(workout ? `Edit ${workout.name}` : undefined)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">{t('workouts.loadingOne')}</span>
      </div>
    )
  }

  if (isError || !workout) {
    return (
      <EmptyState
        title={t('workouts.loadOneFailed')}
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/train')}>
            {t('workouts.backToWorkouts')}
          </Button>
        }
      />
    )
  }

  return <DraftEditor workoutId={id} name={workout.name} exercises={exercises} />
}

export default WorkoutEditPage
