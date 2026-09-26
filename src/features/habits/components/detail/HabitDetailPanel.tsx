import { useState } from 'react'
import { toast } from 'sonner'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { HabitDetailView } from '@/features/habits/components/detail/HabitDetailView'
import { useHabitDetail } from '@/features/habits/hooks/useHabitDetail'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { useSetTodayCount } from '@/features/habits/hooks/useSetTodayCount'
import { useSetTodayNote } from '@/features/habits/hooks/useSetTodayNote'
import { useToggleFreeze } from '@/features/habits/hooks/useToggleFreeze'
import { useUiStore } from '@/stores/ui'
import { toastWithUndo } from '@/lib/undoToast'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface HabitDetailPanelProps {
  id: string
  /** The habit is archived, deleted or failed to load — leave it. */
  onGone: () => void
}

/**
 * One habit's detail with everything it can do, wired to its data: the phone's
 * habit page and the desktop inspector are this same panel.
 */
export function HabitDetailPanel({ id, onGone }: HabitDetailPanelProps) {
  const { t } = useT()
  const openEditHabit = useUiStore((s) => s.openEditHabit)
  const { habit, stats, isLoading, isError } = useHabitDetail(id)
  const { archive, restore, remove } = useHabitMutations()
  const toggleFreeze = useToggleFreeze()
  const setTodayCount = useSetTodayCount(habit)
  const setTodayNote = useSetTodayNote(habit)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Neither is awaited: offline the write queues, and the panel is already gone.
  // Archive is reversible, so it goes at once with an Undo; delete erases the
  // history too, so it waits for the red confirm and has no way back.
  const handleArchive = () => {
    if (!habit) return
    archive.mutate(id, {
      onError: (error) => toast.error(toUserError(error, t, 'habits.archiveFailed')),
    })
    toastWithUndo(t('habits.archived'), t('common.undo'), () => restore.mutate(habit))
    onGone()
  }

  const handleDelete = () => {
    remove.mutate(id)
    toast.success(t('habits.deleted'))
    setConfirmDelete(false)
    onGone()
  }

  if (isLoading) {
    return <LoadingState label={t('habits.loadingOne')} />
  }

  if (isError || !habit || !stats) {
    return (
      <EmptyState
        title={t('habits.loadOneFailed')}
        action={
          <Button size="sm" variant="surface" onClick={onGone}>
            {t('habits.backToHabits')}
          </Button>
        }
      />
    )
  }

  return (
    <>
      <HabitDetailView
        habit={habit}
        stats={stats}
        onSetCount={(count) =>
          setTodayCount.mutate(count, {
            onError: (error) => toast.error(toUserError(error, t, 'habits.updateFailed')),
          })
        }
        onSaveNote={(note) =>
          setTodayNote.mutate(note, {
            onError: (error) => toast.error(toUserError(error, t, 'habits.noteFailed')),
          })
        }
        onToggleFreeze={() =>
          toggleFreeze.mutate(
            { habitId: id, freeze: !stats.todayFrozen },
            { onError: (error) => toast.error(toUserError(error, t, 'habits.freezeFailed')) },
          )
        }
        onEdit={() => openEditHabit(habit.id)}
        onArchive={handleArchive}
        onDelete={() => setConfirmDelete(true)}
      />

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('habits.confirmDeleteTitle')}
        description={t('habits.confirmDeleteBody', { name: habit.name })}
        confirmLabel={t('habits.deleteForever')}
        onConfirm={handleDelete}
      />
    </>
  )
}
