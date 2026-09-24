import type { ReactNode } from 'react'
import { useT } from '@/hooks/useT'

interface ProfileStatsProps {
  activeDays: number
  bestStreak: number
  badges: number
  badgesTotal: number
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-card bg-surface p-3 text-center lg:bg-transparent">
      <b className="num block text-headline font-medium">{value}</b>
      <span className="text-footnote text-muted">{label}</span>
    </div>
  )
}

/** Three numbers under the avatar: active days · best streak · badges N/total. */
export function ProfileStats({ activeDays, bestStreak, badges, badgesTotal }: ProfileStatsProps) {
  const { t } = useT()
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Stat value={activeDays} label={t('profile.statActive', { count: activeDays })} />
      <Stat value={bestStreak} label={t('profile.statBest')} />
      <Stat
        value={
          <>
            {badges}
            <small className="text-callout text-muted-strong">/{badgesTotal}</small>
          </>
        }
        label={t('profile.statBadges', { count: badges })}
      />
    </div>
  )
}
