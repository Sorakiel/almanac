import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { NewBadgeDot } from '@/components/common/NewBadgeDot'
import { Avatar } from '@/components/common/Avatar'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { AlmanacNarrator } from '@/features/dashboard/components/AlmanacNarrator'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Rail } from '@/components/rail/Rail'
import { NowBlock } from '@/features/dashboard/components/NowBlock'
import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import { TodayStrip } from '@/features/dashboard/components/TodayStrip'
import { TodaysWorkoutsBlock } from '@/features/dashboard/components/TodaysWorkoutsBlock'
import { DashboardWorkspace } from '@/features/dashboard/components/desktop/DashboardWorkspace'
import { DashboardRail } from '@/features/dashboard/components/desktop/DashboardRail'
import { HabitRow } from '@/features/habits/components/HabitRow'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useDayCompletionBeacon } from '@/features/social/hooks/useDayCompletionBeacon'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSession } from '@/hooks/useSession'
import { useT, type TFunction } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { useUiStore } from '@/stores/ui'

function greeting(hour: number, t: TFunction): string {
  if (hour < 12) return t('dashboard.goodMorning')
  if (hour < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
}

function DashboardPage() {
  const { t } = useT()
  const { user } = useSession()
  const { longDate, dateKey } = useToday()
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // The fallback is a translated word, not a bare "there": an account with no
  // display name showed "Доброе утро, there" on a fully Russian screen.
  const fallbackName = t('dashboard.friend')
  const name = (user?.user_metadata.display_name as string | undefined)?.trim() || fallbackName
  const firstName = name.split(' ')[0] || fallbackName
  const dueHabits = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = dueHabits.filter((h) => h.isComplete).length

  // Publish a "closed the day" event for the friends feed once all due habits
  // are done (idempotent no-op if there are no friends / already emitted).
  useDayCompletionBeacon(completed, dueHabits.length, dateKey)
  const dateLabel = longDate.replace(/,/, ' ·').toUpperCase()

  if (isError) {
    return <ErrorState title={t('dashboard.loadFailed')} onRetry={refetch} />
  }

  if (isLoading) {
    return <LoadingState label={t('dashboard.loading')} className="py-16" />
  }

  if (isDesktop) {
    return (
      <>
        <DashboardWorkspace
          habits={habits}
          greeting={greeting(new Date().getHours(), t)}
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
          <p className="label-mono">{dateLabel}</p>
          <h1 className="mt-1 text-2xl">
            {greeting(new Date().getHours(), t)}, {firstName}
          </h1>
        </div>
        <Link to="/settings" aria-label={t('nav.profileAndSettings')} className="rounded-tile">
          <NewBadgeDot corner />
          <Avatar name={name} size="sm" />
        </Link>
      </header>

      {/* Order is the whole point of this screen: the thing the app is opened
          to do comes first. A running focus block outranks even that, because
          it is live; the narrator and the quote are reading material and sit
          below the fold on purpose. */}
      <Cascade>
        <NowBlock />

        <TodayStrip habits={habits} />

        <section className="flex flex-col gap-2">
          {/* No done/total accessory here — the strip directly above already
              carries it, and two copies a centimetre apart taught nothing. */}
          <SectionLabel>{t('dashboard.todayHabits')}</SectionLabel>

          {habits.length === 0 ? (
            <EmptyState
              title={t('dashboard.startFirstHabit')}
              description={t('dashboard.startFirstHabitHint')}
              action={
                <Button size="sm" onClick={openNewHabit}>
                  <Plus className="h-4 w-4" />
                  {t('dashboard.addHabit')}
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

        <TodaysWorkoutsBlock />

        <AlmanacNarrator habits={habits} />

        <QuoteCard />
      </Cascade>
    </div>
  )
}

export default DashboardPage
