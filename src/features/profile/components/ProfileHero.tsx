import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar'
import type { ActiveDays } from '@/features/profile/lib/almanacGrid'
import type { AvatarColor } from '@/features/profile/lib/avatarColors'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface ProfileHeroProps {
  name: string
  email: string
  color: AvatarColor
  /** "13 июля" — already formatted in the interface language. */
  joined: string | null
  activeDays: ActiveDays
  onEdit: () => void
  className?: string
}

/** Who you are: ringed avatar, name, email, tenure, and the way to change it. */
export function ProfileHero({
  name,
  email,
  color,
  joined,
  activeDays,
  onEdit,
  className,
}: ProfileHeroProps) {
  const { t } = useT()
  const { active, total } = activeDays
  const progress = total > 0 ? active / total : 0
  const since = joined ? t('profile.since', { date: joined }) : null
  const ring = total > 0 ? t('profile.ring', { count: active, total }) : null

  return (
    <div className={cn('grid justify-items-center gap-1.5 pb-1 pt-1.5 text-center', className)}>
      <ProfileAvatar
        name={name}
        color={color}
        progress={progress}
        className="h-avatar w-avatar lg:h-28 lg:w-28"
        label={t('profile.ringAria', { active, total })}
      />
      <h1 className="mt-1.5 text-title font-bold">{name}</h1>
      <p className="text-callout text-muted">{email}</p>
      {since || ring ? (
        <p className="text-footnote font-medium text-muted-strong">
          {[since, ring].filter(Boolean).join(' · ')}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        className="mt-2 rounded-pill bg-accent/15 px-3.5 py-2 text-callout font-semibold text-accent transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
      >
        {t('profile.edit')}
      </button>
    </div>
  )
}
