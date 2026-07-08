import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { CompletionDonut } from '@/features/dashboard/components/CompletionDonut'
import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useUiStore } from '@/stores/ui'

function DashboardPage() {
  const { user } = useSession()
  const { longDate } = useToday()
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)

  const completed = habits.filter((h) => h.isComplete).length
  const firstName = (user?.user_metadata.display_name as string | undefined)?.split(' ')[0]

  return (
    <div className="flex flex-col gap-5 pt-2">
      <header>
        <p className="label-mono">{longDate}</p>
        <h1 className="text-2xl">{firstName ? `Hi, ${firstName}` : 'Today'}</h1>
      </header>

      {isError ? (
        <EmptyState
          title="Couldn't load your day"
          description="Something went wrong reaching the server."
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading…</span>
        </div>
      ) : (
        <>
          <Card className="flex items-center gap-5">
            <CompletionDonut completed={completed} total={habits.length} />
            <div className="flex flex-col gap-1">
              <p className="label-mono">// progress</p>
              <p className="text-lg font-semibold">
                {habits.length === 0
                  ? 'No habits yet'
                  : completed === habits.length
                    ? 'All done today 🎉'
                    : `${completed} of ${habits.length} done`}
              </p>
              <p className="text-sm text-muted">Tap a habit below to log it.</p>
            </div>
          </Card>

          <QuoteCard />

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="label-mono">// today&apos;s habits</p>
              <Button size="sm" variant="ghost" onClick={openNewHabit}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {habits.length === 0 ? (
              <EmptyState
                title="Start your first habit"
                description="One small daily action, tracked."
                action={
                  <Button size="sm" onClick={openNewHabit}>
                    <Plus className="h-4 w-4" />
                    Add habit
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {habits.map((habit) => (
                  <li key={habit.id}>
                    <HabitCard habit={habit} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage
