import { useCallback, useState } from 'react'
import { ListChecks, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Inspector } from '@/components/inspector/Inspector'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { SortableHabitList } from '@/features/habits/components/SortableHabitList'
import { TodayProgress } from '@/features/habits/components/TodayProgress'
import { HabitsWorkspace } from '@/features/habits/components/desktop/HabitsWorkspace'
import { HabitDetailPanel } from '@/features/habits/components/detail/HabitDetailPanel'
import { useLastValue } from '@/hooks/useSheetKey'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { FILTERS } from '@/features/habits/lib/filters'
import { riseStagger } from '@/lib/motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUiStore } from '@/stores/ui'
import { useT } from '@/hooks/useT'

function HabitsPage() {
  const { t } = useT()
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  // Only the desktop workspace filters; on a phone the list is short enough to scan.
  const [filterIndex, setFilterIndex] = useState(0)
  // Reordering lives here, behind an explicit mode, so Today stays tap-only.
  const [reordering, setReordering] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  // Desktop opens a habit in the inspector; the last one stays rendered while
  // the panel slides out.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const shownId = useLastValue(selectedId)
  const closeInspector = useCallback(() => setSelectedId(null), [])

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
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
        />
        <Inspector
          open={selectedId !== null}
          onClose={closeInspector}
          label={t('habits.inspector')}
        >
          {shownId ? <HabitDetailPanel key={shownId} id={shownId} onGone={closeInspector} /> : null}
        </Inspector>
      </>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">{t('habits.activeCount', { count: habits.length })}</p>
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
          <ul className="flex flex-col gap-3">
            {habits.map((habit, i) => {
              const rise = stagger(i)
              return (
                <li key={habit.id} className={rise.className} style={rise.style}>
                  <HabitCard habit={habit} />
                </li>
              )
            })}
          </ul>
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
