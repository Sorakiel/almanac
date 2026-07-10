import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Check, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/common/IconTile'
import { StatTile } from '@/components/common/StatTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { HabitHeatmap } from '@/features/habits/components/HabitHeatmap'
import { useHabitDetail } from '@/features/habits/hooks/useHabitDetail'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { setHabitCount } from '@/features/habits/api/habits.api'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { dailyTarget, frequencyLabel } from '@/features/habits/lib/frequency'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

function HabitDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const openEditHabit = useUiStore((s) => s.openEditHabit)
  const { habit, stats, isLoading, isError } = useHabitDetail(id)
  const { archive } = useHabitMutations()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    try {
      await archive.mutateAsync(id)
      toast.success('Habit deleted')
      navigate('/habits')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete habit')
    }
  }

  const markDone = useMutation({
    mutationFn: (done: boolean) =>
      setHabitCount({
        userId: user?.id ?? '',
        habitId: id,
        date: dateKey,
        count: done && habit ? dailyTarget(habit) : 0,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habitHistory', id] })
      void queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not update habit'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (isError || !habit || !stats) {
    return (
      <EmptyState
        title="Couldn't load this habit"
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/habits')}>
            Back to habits
          </Button>
        }
      />
    )
  }

  const color = resolveHabitColor(habit.color)
  const Icon = resolveHabitIcon(habit.icon)

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/habits')}
          aria-label="Back"
          className="rounded-full p-1 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <IconTile icon={Icon} tone={color.tile} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl">{habit.name}</h1>
          <p className="label-mono">{frequencyLabel(habit)}</p>
        </div>
        <button
          type="button"
          onClick={() => openEditHabit(habit.id)}
          aria-label="Edit habit"
          className="rounded-full p-2 text-muted hover:bg-surface hover:text-foreground"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete habit"
          className="rounded-full p-2 text-muted hover:bg-surface hover:text-accent"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Streak" value={`${stats.streak}d`} accent />
        <StatTile label="Best" value={`${stats.best}d`} />
        <StatTile label="Rate" value={`${stats.ratePct}%`} />
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>LAST 12 MONTHS</SectionLabel>
        <HabitHeatmap days={stats.heatmap} />
      </div>

      {habit.description ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>NOTES</SectionLabel>
          <div className="rounded-card border-l-2 border-accent bg-surface px-4 py-3 text-sm leading-relaxed">
            {habit.description}
          </div>
        </div>
      ) : null}

      <Button
        size="lg"
        variant={stats.todayDone ? 'surface' : 'primary'}
        className={cn('mt-2 w-full', !stats.todayDone && 'shadow-glow')}
        disabled={markDone.isPending}
        onClick={() => markDone.mutate(!stats.todayDone)}
      >
        <Check className="h-4 w-4" />
        {stats.todayDone ? 'Completed today' : 'Mark done for today'}
      </Button>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this habit?"
        description={`"${habit.name}" and its streak will disappear from your lists. Its history is kept.`}
        confirmLabel="Delete habit"
        pending={archive.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default HabitDetailPage
