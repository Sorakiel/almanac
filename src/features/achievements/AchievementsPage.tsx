import { ArrowLeft, Loader2, RefreshCw, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { AchievementCard } from '@/features/achievements/components/AchievementCard'
import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { levelsEarned, unlockedCount } from '@/features/achievements/lib/evaluate'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-2xl tabular-nums">{value}</span>
      <span className="label-mono text-muted-strong">{label}</span>
    </div>
  )
}

function AchievementsPage() {
  const { achievements, isLoading, isError, refetch } = useAchievements()

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading achievements…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load achievements"
        description="Something went wrong reaching the server."
        action={
          <Button size="sm" variant="surface" onClick={refetch}>
            Try again
          </Button>
        }
      />
    )
  }

  const unlocked = unlockedCount(achievements)

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Settings
        </Link>

        <header className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="label-mono">// your trophies</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl lg:text-[32px] lg:tracking-title">
              <Trophy className="h-6 w-6 text-accent" aria-hidden="true" />
              Achievements
            </h1>
          </div>
          <div className="flex gap-6">
            <Stat value={unlocked} label={`of ${achievements.length}`} />
            <Stat value={levelsEarned(achievements)} label="levels" />
          </div>
        </header>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((item) => (
          <AchievementCard key={item.def.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default AchievementsPage
