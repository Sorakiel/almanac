import { useState } from 'react'
import { ListChecks, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useUiStore } from '@/stores/ui'
import type { HabitFrequency } from '@/features/habits/types'

const FILTERS: { value: HabitFrequency | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'daily', label: 'daily' },
  { value: 'weekly', label: 'weekly' },
  { value: 'x_per_week', label: 'n× / wk' },
]

function HabitsPage() {
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const [filterIndex, setFilterIndex] = useState(0)

  const filter = FILTERS[filterIndex]!
  const visible =
    filter.value === 'all' ? habits : habits.filter((h) => h.frequency === filter.value)

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">// {habits.length} active</p>
          <h1 className="mt-1 text-2xl">Habits</h1>
        </div>
        {habits.length > 0 ? (
          <button
            type="button"
            onClick={() => setFilterIndex((i) => (i + 1) % FILTERS.length)}
            aria-label={`Filter by frequency: ${filter.label}. Tap for next filter.`}
            className="rounded-pill border px-3 py-2 font-mono text-[10px] tracking-label text-muted transition-colors hover:text-foreground"
          >
            ◇ {filter.label} ‹›
          </button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading habits…</span>
        </div>
      ) : isError ? (
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
      ) : habits.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No habits yet"
          description="Create your first habit to start a streak."
          action={
            <Button size="sm" onClick={openNewHabit}>
              <Plus className="h-4 w-4" />
              Add habit
            </Button>
          }
        />
      ) : (
        <>
          {visible.length === 0 ? (
            <EmptyState
              title={`Nothing matches "${filter.label}"`}
              description="Tap the filter pill to cycle to another frequency."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((habit) => (
                <li key={habit.id}>
                  <HabitCard habit={habit} />
                </li>
              ))}
            </ul>
          )}
          <Button size="lg" onClick={openNewHabit} className="w-full shadow-glow">
            <Plus className="h-4 w-4" />
            New habit
          </Button>
        </>
      )}
    </section>
  )
}

export default HabitsPage
