import { ListChecks, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { cn } from '@/lib/utils'
import type { HabitFrequency, HabitWithTodayLog } from '@/features/habits/types'

interface HabitsWorkspaceProps {
  habits: HabitWithTodayLog[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  filters: { value: HabitFrequency | 'all'; label: string }[]
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
  const filter = filters[filterIndex]!
  const visible =
    filter.value === 'all' ? habits : habits.filter((h) => h.frequency === filter.value)

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// {habits.length} active</p>
          <h1 className="mt-1.5 text-[40px] leading-none tracking-title">Habits</h1>
        </div>
        <Button onClick={onNew} className="rounded-[13px] shadow-glow">
          <Plus className="h-4 w-4" />
          New habit
        </Button>
      </header>

      {habits.length > 0 ? (
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
                  ? 'bg-accent font-semibold text-on-accent'
                  : 'border text-muted hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-24" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading habits…</span>
        </div>
      ) : isError ? (
        <div className="mt-6">
          <EmptyState
            icon={RefreshCw}
            title="Couldn't load your habits"
            description="Something went wrong reaching the server."
            action={
              <Button size="sm" variant="surface" onClick={refetch}>
                Try again
              </Button>
            }
          />
        </div>
      ) : habits.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ListChecks}
            title="No habits yet"
            description="Create your first habit to start a streak."
            action={
              <Button size="sm" onClick={onNew}>
                <Plus className="h-4 w-4" />
                Add habit
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={`Nothing matches "${filter.label}"`}
            description="Pick another frequency above."
          />
        </div>
      ) : (
        <div className="mt-[22px] grid grid-cols-2 gap-3.5">
          {visible.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  )
}
