import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Archive, ArrowLeft, Check, MoreHorizontal, Pencil, Snowflake, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { IconTile } from '@/components/common/IconTile'
import { StatTile } from '@/components/common/StatTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { Rail } from '@/components/rail/Rail'
import { HabitChecklist } from '@/features/habits/components/HabitChecklist'
import { HabitHeatmap } from '@/features/habits/components/HabitHeatmap'
import { HabitDetailWorkspace } from '@/features/habits/components/desktop/HabitDetailWorkspace'
import { HabitDetailRail } from '@/features/habits/components/desktop/HabitDetailRail'
import { useHabitDetail } from '@/features/habits/hooks/useHabitDetail'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { useMarkHabitDone } from '@/features/habits/hooks/useMarkHabitDone'
import { useToggleFreeze } from '@/features/habits/hooks/useToggleFreeze'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { frequencyLabel, timeOfDayLabel } from '@/features/habits/lib/frequency'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUiStore } from '@/stores/ui'
import { toastWithUndo } from '@/lib/undoToast'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

function HabitDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const openEditHabit = useUiStore((s) => s.openEditHabit)
  const { habit, stats, isLoading, isError } = useHabitDetail(id)
  const { archive, restore, remove } = useHabitMutations()
  const toggleFreeze = useToggleFreeze()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Neither is awaited: offline the write queues, and the page is already gone.
  // Archive is reversible, so it goes at once with an Undo; delete erases the
  // history too, so it waits for the red confirm and has no way back.
  const handleArchive = () => {
    if (!habit) return
    setMenuOpen(false)
    archive.mutate(id, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : t('habits.archiveFailed')),
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

  const markDone = useMarkHabitDone(habit)
  const setDone = (done: boolean) =>
    markDone.mutate(done, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : t('habits.updateFailed')),
    })

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

  const color = resolveHabitColor(habit.color)
  const Icon = resolveHabitIcon(habit.icon)
  const timeLabel = timeOfDayLabel(habit.time_of_day, t)
  const subtitle = [frequencyLabel(habit, t), timeLabel].filter(Boolean).join(' · ')

  const overlays = (
    <>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={habit.name}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              openEditHabit(habit.id)
            }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-surface"
          >
            <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />
            {t('habits.editHabit')}
          </button>
          <button
            type="button"
            onClick={handleArchive}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-surface"
          >
            <Archive className="h-4 w-4 text-muted" aria-hidden="true" />
            {t('habits.archiveHabit')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              setConfirmDelete(true)
            }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-danger hover:bg-surface"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('habits.deleteHabit')}
          </button>
        </div>
      </Sheet>

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

  if (isDesktop) {
    return (
      <>
        <HabitDetailWorkspace
          habit={habit}
          stats={stats}
          onEdit={() => openEditHabit(habit.id)}
          onArchive={handleArchive}
          onDelete={() => setConfirmDelete(true)}
        />
        <Rail>
          <HabitDetailRail
            habit={habit}
            stats={stats}
            onMarkDone={setDone}
            onToggleFreeze={(freeze) =>
              toggleFreeze.mutate(
                { habitId: id, freeze },
                {
                  onError: (error) =>
                    toast.error(error instanceof Error ? error.message : t('habits.freezeFailed')),
                },
              )
            }
          />
        </Rail>
        {overlays}
      </>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/habits')}
          aria-label={t('habits.back')}
          className="rounded-full p-1 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <IconTile icon={Icon} tone={color.tile} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl">{habit.name}</h1>
          <p className="label-mono">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('habits.habitOptions')}
          className="rounded-full p-2 text-muted hover:bg-surface hover:text-foreground"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t('habits.streak')}
          value={t('units.daysShort', { count: stats.streak })}
          accent
        />
        <StatTile label={t('habits.best')} value={t('units.daysShort', { count: stats.best })} />
        <StatTile label={t('habits.rate')} value={`${stats.ratePct}%`} />
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>{t('habits.lastTwelveMonths')}</SectionLabel>
        <HabitHeatmap days={stats.heatmap} createdKey={stats.createdKey} />
      </div>

      {habit.description ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>{t('habits.notes')}</SectionLabel>
          <div className="rounded-r-card border-l-2 border-accent bg-surface px-4 py-3 text-sm leading-relaxed">
            {habit.description}
          </div>
        </div>
      ) : null}

      <HabitChecklist habit={habit} />

      <div className="mt-auto flex flex-col gap-2">
        {!stats.todayDone ? (
          <Button
            size="lg"
            variant={stats.todayFrozen ? 'primary' : 'surface'}
            className="w-full"
            onClick={() =>
              toggleFreeze.mutate(
                { habitId: id, freeze: !stats.todayFrozen },
                {
                  onError: (error) =>
                    toast.error(error instanceof Error ? error.message : t('habits.freezeFailed')),
                },
              )
            }
          >
            <Snowflake className="h-4 w-4" />
            {stats.todayFrozen ? t('habits.frozenToday') : t('habits.freezeToday')}
          </Button>
        ) : null}
        <Button
          size="lg"
          variant={stats.todayDone ? 'surface' : 'primary'}
          className={cn('w-full', !stats.todayDone && !stats.todayFrozen && 'shadow-glow')}
          onClick={() => setDone(!stats.todayDone)}
        >
          <Check className="h-4 w-4" />
          {stats.todayDone ? t('habits.completedToday') : t('habits.markDone')}
        </Button>
      </div>

      {overlays}
    </div>
  )
}

export default HabitDetailPage
