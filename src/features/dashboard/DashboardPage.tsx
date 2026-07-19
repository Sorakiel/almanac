import { Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { StatusLine } from '@/components/common/StatusLine'
import { Rail } from '@/components/common/desktop/rail'
import { NowBlock } from '@/features/dashboard/components/NowBlock'
import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import { TodaysWorkoutsBlock } from '@/features/dashboard/components/TodaysWorkoutsBlock'
import { DashboardWorkspace } from '@/features/dashboard/components/desktop/DashboardWorkspace'
import { DashboardRail } from '@/features/dashboard/components/desktop/DashboardRail'
import { SortableHabitList } from '@/features/habits/components/SortableHabitList'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useDayCompletionBeacon } from '@/features/social/hooks/useDayCompletionBeacon'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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
  const { longDate, dateKey } = useToday()
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const name = (user?.user_metadata.display_name as string | undefined) ?? 'there'
  const firstName = name.split(' ')[0] ?? 'there'
  const dueHabits = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = dueHabits.filter((h) => h.isComplete).length

  // Publish a "closed the day" event for the friends feed once all due habits
  // are done (idempotent no-op if there are no friends / already emitted).
  useDayCompletionBeacon(completed, dueHabits.length, dateKey)
  const dateLabel = longDate.replace(/,/, ' ·').toUpperCase()

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load your day"
        description="Something went wrong reaching the server."
        action={
          <Button size="sm" variant="surface" onClick={refetch}>
            Try again
          </Button>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (isDesktop) {
    return (
      <>
        <DashboardWorkspace
          habits={habits}
          greeting={greeting(new Date().getHours())}
          firstName={firstName}
        />
        <Rail>
          <DashboardRail habits={habits} />
        </Rail>
      </>
    )
  }

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

      <QuoteCard />

      <NowBlock habits={habits} />

      <section className="flex flex-col gap-2">
        <SectionLabel
          accessory={habits.length > 0 ? `${completed} / ${dueHabits.length} done` : undefined}
        >
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
          <SortableHabitList habits={habits} />
        )}
      </section>

      <TodaysWorkoutsBlock />

      <StatusLine habitCount={habits.length} className="mt-1 px-1" />
    </div>
  )
}

export default DashboardPage
