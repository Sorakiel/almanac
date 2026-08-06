import { ListChecks, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { FILTER_THRESHOLD } from '@/features/habits/lib/filters'
import { riseStagger } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { HabitFrequency, HabitWithTodayLog } from '@/features/habits/types'
import { useT } from '@/hooks/useT'

interface HabitsWorkspaceProps {
  habits: HabitWithTodayLog[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  filters: { value: HabitFrequency | 'all' }[]
  filterIndex: number
  onFilter: (index: number) => void
  onNew: () => void
}

/** Desktop "Habits" workspace: title, frequency pills, two-column card grid. */
export function HabitsWorkspace({
  habits,
  isLoading,
  isError,
  refetch,
  filters,
  filterIndex,
  onFilter,
  onNew,
}: HabitsWorkspaceProps) {
  const { t } = useT()
  const filter = filters[filterIndex]!
  const filterLabel = t(`habits.filters.${filter.value}`)
  const visible =
    filter.value === 'all' ? habits : habits.filter((h) => h.frequency === filter.value)
  const stagger = riseStagger()

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// {t('habits.activeCount', { count: habits.length })}</p>
          <h1 className="mt-1.5 text-[40px] leading-none tracking-title">{t('habits.title')}</h1>
        </div>
        {/* The empty state carries its own CTA; two identical buttons 200px
            apart is a choice the reader has to make for no reason. */}
        {habits.length > 0 ? (
          <Button onClick={onNew} className="rounded-[13px] shadow-glow">
            <Plus className="h-4 w-4" />
            {t('habits.newHabit')}
          </Button>
        ) : null}
      </header>

      {habits.length >= FILTER_THRESHOLD ? (
        <div className="mt-[22px] flex flex-wrap gap-2">
          {filters.map((f, i) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilter(i)}
              aria-pressed={i === filterIndex}
              className={cn(
                'rounded-pill px-[15px] py-2 font-mono text-[11px] uppercase tracking-label transition-colors',
                i === filterIndex
                  ? 'bg-accent-solid font-semibold text-on-accent-solid'
                  : 'border text-muted hover:text-foreground',
              )}
            >
              {t(`habits.filters.${f.value}`)}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">{t('habits.loading')}</span>
        </div>
      ) : isError ? (
        <div className="mt-6">
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
        </div>
      ) : habits.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ListChecks}
            title={t('habits.emptyTitle')}
            description={t('habits.emptyHint')}
            action={
              <Button size="sm" onClick={onNew}>
                <Plus className="h-4 w-4" />
                {t('habits.addHabit')}
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t('habits.noneMatch', { name: filterLabel })}
            description={t('habits.filterHintDesktop')}
          />
        </div>
      ) : (
        <div className="mt-[22px] grid grid-cols-2 gap-3.5">
          {visible.map((habit, i) => {
            const rise = stagger(i)
            return (
              <div key={habit.id} className={rise.className} style={rise.style}>
                <HabitCard habit={habit} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
