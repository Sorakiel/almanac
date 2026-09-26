import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
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

function HabitDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const openEditHabit = useUiStore((s) => s.openEditHabit)
  const { habit, stats, isLoading, isError } = useHabitDetail(id)
  const { archive, restore, remove } = useHabitMutations()
  const toggleFreeze = useToggleFreeze()
  const setTodayCount = useSetTodayCount(habit)
  const setTodayNote = useSetTodayNote(habit)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Back to wherever the row was tapped (Today or Habits); a deep link has no
  // history in the app, so it lands on the list.
  const back = () => (location.key === 'default' ? navigate('/habits') : navigate(-1))

  // Neither is awaited: offline the write queues, and the page is already gone.
  // Archive is reversible, so it goes at once with an Undo; delete erases the
  // history too, so it waits for the red confirm and has no way back.
  const handleArchive = () => {
    if (!habit) return
    archive.mutate(id, {
      onError: (error) => toast.error(toUserError(error, t, 'habits.archiveFailed')),
    })
    toastWithUndo(t('habits.archived'), t('common.undo'), () => restore.mutate(habit))
    navigate('/habits')
  }

  const handleDelete = () => {
    remove.mutate(id)
    toast.success(t('habits.deleted'))
    setConfirmDelete(false)
    navigate('/habits')
  }

  if (isLoading) {
    return <LoadingState label={t('habits.loadingOne')} />
  }

  if (isError || !habit || !stats) {
    return (
      <EmptyState
        title={t('habits.loadOneFailed')}
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/habits')}>
            {t('habits.backToHabits')}
          </Button>
        }
      />
    )
  }

  return (
    <div className="lg:mx-auto lg:w-full lg:max-w-[560px]">
      <button
        type="button"
        onClick={back}
        className="-ml-1.5 flex items-center gap-0.5 py-2 text-body text-accent"
      >
        <ChevronLeft aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2.4} />
        {t('habits.back')}
      </button>

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
    </div>
  )
}

export default HabitDetailPage
