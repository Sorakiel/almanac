import { useState } from 'react'
import { ListChecks, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { AlmanacNarrator } from '@/features/dashboard/components/AlmanacNarrator'
import { HabitCard } from '@/features/habits/components/HabitCard'
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
        {habits.length >= FILTER_THRESHOLD ? (
          <button
            type="button"
            onClick={() => setFilterIndex((i) => (i + 1) % FILTERS.length)}
            aria-label={t('habits.filterAria', { name: filterLabel })}
            className="rounded-pill border px-3 py-2 font-mono text-[10px] tracking-label text-muted transition-colors hover:text-foreground"
          >
            ◇ {filterLabel} ‹›
          </button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">{t('habits.loading')}</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title={t('habits.loadFailed')}
          description={t('habits.loadFailedHint')}
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              {t('habits.tryAgain')}
            </Button>
          }
        />
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
      ) : (
        <>
          <AlmanacNarrator habits={habits} />
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
