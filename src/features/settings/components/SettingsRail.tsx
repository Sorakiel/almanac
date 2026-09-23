import { useProfile } from '@/features/settings/hooks/useProfile'
import { SignOutButton } from '@/features/settings/components/SignOutButton'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { RailCard, RailRow } from '@/components/rail/RailCard'
import { RailIdentity } from '@/components/rail/RailIdentity'
import { intlLocale } from '@/lib/dateLocale'
import { browserTimezone } from '@/lib/date'
import { APP_VERSION } from '@/lib/version'

/** Desktop Settings context rail: Almanac identity + account meta. */
export function SettingsRail() {
  const { t, locale } = useT()
  const { user } = useSession()
  const { profile } = useProfile()

  // Month names have to follow the interface language, not the build locale.
  const joined = user?.created_at
    ? new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', year: 'numeric' }).format(
        new Date(user.created_at),
      )
    : '—'
  const role =
    profile?.role === 'owner'
      ? t('rail.owner')
      : profile?.role === 'admin'
        ? t('rail.admin')
        : t('rail.member')

  return (
    <div className="flex flex-1 flex-col gap-3.5">
      <RailIdentity title="The Almanac" subtitle={`v${APP_VERSION} · ${t('rail.commandCenter')}`} />

      <RailCard label={t('rail.account')}>
        <RailRow label={t('rail.role')} value={role} />
        <RailRow label={t('rail.joined')} value={joined} />
        <RailRow
          label={t('rail.timezone')}
          value={(profile?.timezone ?? browserTimezone()).replace(/_/g, ' ')}
        />
      </RailCard>

      <p className="px-1 text-[13px] italic leading-relaxed text-muted">{t('rail.motto')}</p>

      <SignOutButton className="mt-auto w-full" />
    </div>
  )
}
