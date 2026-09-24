import { useState } from 'react'
import { ListChecks, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/rail/Rail'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { SortableHabitList } from '@/features/habits/components/SortableHabitList'
import { TodayProgress } from '@/features/habits/components/TodayProgress'
import { HabitsWorkspace } from '@/features/habits/components/desktop/HabitsWorkspace'
import { HabitsRail } from '@/features/habits/components/desktop/HabitsRail'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { FILTERS, FILTER_THRESHOLD } from '@/features/habits/lib/filters'
import { riseStagger } from '@/lib/motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUiStore } from '@/stores/ui'
import { useT } from '@/hooks/useT'

function HabitsPage() {
  const { t } = useT()
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const [filterIndex, setFilterIndex] = useState(0)
  // Reordering lives here, behind an explicit mode, so Today stays tap-only.
  const [reordering, setReordering] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const filter = FILTERS[filterIndex]!
  const filterLabel = t(`habits.filters.${filter.value}`)
  const visible =
    filter.value === 'all' ? habits : habits.filter((h) => h.frequency === filter.value)
  const stagger = riseStagger()

  if (isDesktop) {
    return (
      <>
        <HabitsWorkspace
          habits={habits}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          filters={FILTERS}
          filterIndex={filterIndex}
          onFilter={setFilterIndex}
          onNew={openNewHabit}
        />
        <Rail>
          <HabitsRail habits={habits} />
        </Rail>
      </>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">// {t('habits.activeCount', { count: habits.length })}</p>
          <h1 className="mt-1 text-2xl">{t('habits.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {habits.length > 1 ? (
            <Button
              size="sm"
              variant={reordering ? 'primary' : 'surface'}
              aria-pressed={reordering}
              onClick={() => setReordering((on) => !on)}
            >
              {reordering ? t('habits.doneEditing') : t('habits.editOrder')}
            </Button>
          ) : null}
          {!reordering && habits.length >= FILTER_THRESHOLD ? (
            <button
              type="button"
              onClick={() => setFilterIndex((i) => (i + 1) % FILTERS.length)}
              aria-label={t('habits.filterAria', { name: filterLabel })}
              className="rounded-pill border px-3 py-2 font-mono text-[10px] tracking-label text-muted transition-colors hover:text-foreground"
            >
              ◇ {filterLabel} ‹›
            </button>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <LoadingState label={t('habits.loading')} className="py-16" />
      ) : isError ? (
        <ErrorState title={t('habits.loadFailed')} onRetry={refetch} />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t('habits.emptyTitle')}
          description={t('habits.emptyHint')}
          action={
            <Button size="sm" onClick={openNewHabit}>
              <Plus className="h-4 w-4" />
              {t('habits.addHabit')}
            </Button>
          }
        />
      ) : reordering ? (
        <>
          <p className="text-sm text-muted">{t('habits.reorderHint')}</p>
          <SortableHabitList habits={habits} />
        </>
      ) : (
        <>
          <TodayProgress habits={habits} />
          {visible.length === 0 ? (
            <EmptyState
              title={t('habits.noneMatch', { name: filterLabel })}
              description={t('habits.filterHintMobile')}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((habit, i) => {
                const rise = stagger(i)
                return (
                  <li key={habit.id} className={rise.className} style={rise.style}>
                    <HabitCard habit={habit} />
                  </li>
                )
              })}
            </ul>
          )}
          <Button size="lg" onClick={openNewHabit} className="w-full shadow-glow">
            <Plus className="h-4 w-4" />
            {t('habits.newHabit')}
          </Button>
        </>
      )}
    </section>
  )
}

export default HabitsPage
