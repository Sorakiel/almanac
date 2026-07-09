import { Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { FocusBlock } from '@/features/dashboard/components/FocusBlock'
import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import { HabitRow } from '@/features/habits/components/HabitRow'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useUiStore } from '@/stores/ui'

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function DashboardPage() {
  const { user } = useSession()
  const { longDate } = useToday()
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)

  const name = (user?.user_metadata.display_name as string | undefined) ?? 'there'
  const firstName = name.split(' ')[0]
  const completed = habits.filter((h) => h.isComplete).length
  const dateLabel = longDate.replace(/,/, ' ·').toUpperCase()

  return (
    <div className="flex flex-col gap-5 pt-1">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// {dateLabel}</p>
          <h1 className="mt-1 text-2xl">
            {greeting(new Date().getHours())}, {firstName}
          </h1>
        </div>
        <Link to="/settings" aria-label="Profile and settings" className="rounded-tile">
          <Avatar name={name} size="sm" />
        </Link>
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
          <QuoteCard />

          {habits.length > 0 ? (
            <div className="flex flex-col gap-3">
              <SectionLabel>NOW · FOCUS</SectionLabel>
              <FocusBlock habits={habits} />
            </div>
          ) : null}

          <section className="flex flex-col gap-2">
            <SectionLabel accessory={habits.length > 0 ? `${completed} / ${habits.length} done` : undefined}>
              TODAY · HABITS
            </SectionLabel>

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
              <ul className="divide-y divide-border/10">
                {habits.map((habit) => (
                  <li key={habit.id}>
                    <HabitRow habit={habit} />
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
