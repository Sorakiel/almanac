import { useEffect } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { CountUp } from '@/components/common/CountUp'
import { AchievementCard } from '@/features/achievements/components/AchievementCard'
import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { riseStagger } from '@/lib/motion'
import { useBadgesStore } from '@/stores/badges'
import { levelsEarned, unlockedCount } from '@/features/achievements/lib/evaluate'
import { useT } from '@/hooks/useT'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-2xl tabular-nums">
        <CountUp value={value} />
      </span>
      <span className="label-mono text-muted-strong">{label}</span>
    </div>
  )
}

function AchievementsPage() {
  const { t } = useT()
  const { achievements, isLoading, isError, refetch } = useAchievements()
  // Opening the page is what "seen" means for the profile dot.
  const markSeen = useBadgesStore((s) => s.markSeen)
  useEffect(() => markSeen(), [markSeen])

  if (isLoading) {
    return <LoadingState label={t('achievements.loading')} />
  }

  if (isError) {
    return <ErrorState title={t('achievements.loadFailed')} onRetry={refetch} />
  }

  const unlocked = unlockedCount(achievements)
  const stagger = riseStagger()

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('profile.title')}
        </Link>

        <header className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="label-mono">{t('achievements.eyebrow')}</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl lg:text-[32px] lg:tracking-title">
              <Trophy className="h-6 w-6 text-accent" aria-hidden="true" />
              {t('achievements.title')}
            </h1>
          </div>
          <div className="flex gap-6">
            <Stat
              value={unlocked}
              label={t('achievements.ofTotal', { total: achievements.length })}
            />
            <Stat value={levelsEarned(achievements)} label={t('achievements.levels')} />
          </div>
        </header>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((item, i) => {
          const rise = stagger(i)
          return (
            <div key={item.def.id} className={rise.className} style={rise.style}>
              <AchievementCard item={item} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AchievementsPage
