import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { unlockedCount } from '@/features/achievements/lib/evaluate'
import { AlmanacGrid } from '@/features/profile/components/AlmanacGrid'
import { BadgeShelf } from '@/features/profile/components/BadgeShelf'
import { FriendsRow } from '@/features/profile/components/FriendsRow'
import { ProfileHero } from '@/features/profile/components/ProfileHero'
import { ProfileSettings } from '@/features/profile/components/ProfileSettings'
import { ProfileSheets, type ProfileSheetId } from '@/features/profile/components/ProfileSheets'
import { ProfileStats } from '@/features/profile/components/ProfileStats'
import { SettingsGroup } from '@/features/profile/components/SettingsGroup'
import { useProfileActivity } from '@/features/profile/hooks/useProfileActivity'
import { avatarColorKey } from '@/features/profile/lib/avatarColors'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSupportConfig } from '@/features/settings/hooks/useSupportConfig'
import { intlLocale } from '@/lib/dateLocale'
import { APP_VERSION } from '@/lib/version'
import { useBadgesStore } from '@/stores/badges'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

/** Section heading on the phone; the desktop cards carry their own. */
const SECTION_H = 'mx-1 mb-2 flex items-baseline justify-between text-headline font-semibold'

/**
 * Profile (v0.6 §2.7) — who you are and everything you can set, in one place.
 * Replaces Settings. Phone: one column, pushed from the avatar on Today.
 * Desktop: identity on the left (sticky), grouped settings on the right.
 */
function ProfilePage() {
  const { t, locale } = useT()
  const { user, status } = useSession()
  const { profile } = useProfile()
  const { config: supportConfig } = useSupportConfig()
  const { dateKey } = useToday()
  const achievements = useAchievements()
  // The glint lasts until the achievements page has been opened.
  const newestBadge = useBadgesStore((s) => (s.unseen ? s.newestId : null))
  const [sheet, setSheet] = useState<ProfileSheetId | null>(null)

  const joinedAt = profile?.created_at ?? user?.created_at ?? null
  const joinedKey = joinedAt?.slice(0, 10) ?? null
  const activity = useProfileActivity(joinedKey)

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  const metaName = user?.user_metadata.display_name as string | undefined
  const name = profile?.display_name || metaName || t('social.anonymous')
  const email = user?.email ?? ''
  const color = avatarColorKey(profile?.avatar_color)
  const joined = joinedAt
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        day: 'numeric',
        month: 'long',
        ...(joinedKey?.slice(0, 4) !== dateKey.slice(0, 4) ? { year: 'numeric' } : {}),
      }).format(new Date(joinedAt))
    : null
  const unlocked = unlockedCount(achievements.achievements)
  const total = achievements.achievements.length
  const bestStreak = achievements.achievements.find((a) => a.def.id === 'streak')?.value ?? 0
  const supportVisible = Boolean(supportConfig?.enabled && supportConfig.methods.length > 0)
  const badgesCount = t('profile.badgesCount', { count: unlocked, total })

  return (
    <>
      <Link
        to="/"
        className="-ml-1.5 inline-flex items-center gap-0.5 py-2 text-body text-accent lg:hidden"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
        {t('profile.back')}
      </Link>

      <header className="mb-6 hidden lg:block">
        <p className="text-callout text-muted">{t('profile.subtitle')}</p>
        <p className="text-large-title font-bold">{t('profile.title')}</p>
      </header>

      <div className="lg:grid lg:grid-cols-profile lg:items-start lg:gap-6">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:sticky lg:top-0 lg:gap-3.5">
          <div className="lg:rounded-card lg:bg-surface lg:p-5">
            <ProfileHero
              name={name}
              email={email}
              color={color}
              joined={joined}
              activeDays={activity.activeDays}
              onEdit={() => setSheet('edit')}
            />
            <ProfileStats
              activeDays={activity.activeDays.active}
              bestStreak={bestStreak}
              badges={unlocked}
              badgesTotal={total}
            />
          </div>

          <AlmanacGrid
            grid={activity.grid}
            isLoading={activity.isLoading}
            isError={activity.isError}
            onRetry={activity.refetch}
          />

          <section
            className="min-w-0 lg:rounded-card lg:bg-surface lg:p-5"
            aria-label={t('profile.badges')}
          >
            <h2 className={`${SECTION_H} lg:hidden`}>
              {t('profile.badges')}
              <span className="text-callout font-normal tracking-normal text-muted">
                {badgesCount}
              </span>
            </h2>
            <h2 className="mx-1.5 mb-2 hidden text-callout font-semibold text-muted lg:block">
              {t('profile.badges')} · {badgesCount}
            </h2>
            <BadgeShelf
              achievements={achievements.achievements}
              newestId={newestBadge}
              isLoading={achievements.isLoading}
              isError={achievements.isError}
              onRetry={achievements.refetch}
            />
          </section>
        </div>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:mt-0 lg:gap-5">
          <SettingsGroup>
            <FriendsRow />
          </SettingsGroup>
          <ProfileSettings
            profile={profile}
            email={email}
            supportVisible={supportVisible}
            onOpen={setSheet}
          />
          <p className="-mt-1 mb-1.5 text-center text-footnote text-muted-strong">
            {t('profile.version', { version: APP_VERSION })}
          </p>
        </div>
      </div>

      <ProfileSheets
        open={sheet}
        onClose={() => setSheet(null)}
        profile={profile}
        name={name}
        email={email}
        color={color}
      />
    </>
  )
}

export default ProfilePage
