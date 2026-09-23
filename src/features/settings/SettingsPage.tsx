import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlarmClock,
  AtSign,
  BarChart3,
  Bell,
  Clock,
  Coffee,
  Download,
  Heart,
  KeyRound,
  Languages,
  Laptop,
  Lock,
  Moon,
  Newspaper,
  ShieldCheck,
  Trophy,
  UserRound,
  Volume2,
} from 'lucide-react'
import { Segmented } from '@/components/ui/segmented'
import { Rail } from '@/components/rail/Rail'
import { SettingsRail } from '@/features/settings/components/SettingsRail'
import { SettingsSheets, type SettingsSheetId } from '@/features/settings/components/SettingsSheets'
import { ProfileHeader } from '@/features/settings/components/ProfileHeader'
import { SettingsSection } from '@/features/settings/components/SettingsSection'
import { SettingsRow } from '@/features/settings/components/SettingsRow'
import { SettingsToggleRow } from '@/features/settings/components/SettingsToggleRow'
import { SignOutButton } from '@/features/settings/components/SignOutButton'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSupportConfig } from '@/features/settings/hooks/useSupportConfig'
import { LOCALES } from '@/i18n'
import { setAnalyticsEnabled } from '@/lib/analytics'
import { browserTimezone, daysBetween } from '@/lib/date'
import { isDesktopApp } from '@/lib/platform/desktop'
import { APP_VERSION } from '@/lib/version'
import { useDesktopStore } from '@/stores/desktop'
import { usePrefsStore } from '@/stores/prefs'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useTheme } from '@/hooks/useTheme'
import { useToday } from '@/hooks/useToday'

/**
 * Settings, grouped by what you came to change: who you are, how you sign in,
 * how it looks, when it pings you, what it keeps — then the extras.
 */
function SettingsPage() {
  const navigate = useNavigate()
  const { user, status } = useSession()
  const { theme, setTheme } = useTheme()
  const { t, locale } = useT()
  const sound = usePrefsStore((s) => s.sound)
  const setSound = usePrefsStore((s) => s.setSound)
  const analytics = usePrefsStore((s) => s.analytics)
  const setAnalytics = usePrefsStore((s) => s.setAnalytics)
  const { profile } = useProfile()
  const { config: supportConfig } = useSupportConfig()
  const { dateKey } = useToday()
  const runInBackground = useDesktopStore((s) => s.runInBackground)
  const [sheet, setSheet] = useState<SettingsSheetId | null>(null)

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  const metaName = user?.user_metadata.display_name as string | undefined
  const name = profile?.display_name || metaName || t('social.anonymous')
  const email = user?.email ?? ''
  const pendingEmail = user?.new_email
  const joinedDays = user?.created_at
    ? Math.max(1, daysBetween(user.created_at.slice(0, 10), dateKey))
    : 0
  const supportVisible = Boolean(supportConfig?.enabled && supportConfig.methods.length > 0)
  const reminderEnabled = profile?.reminder_enabled ?? false
  const digestEnabled = profile?.digest_enabled ?? false
  const isStaff = profile?.role === 'admin' || profile?.role === 'owner'
  const open = (id: SettingsSheetId) => () => setSheet(id)

  return (
    <>
      <div className="flex flex-col gap-6 lg:mx-auto lg:max-w-[760px]">
        <ProfileHeader name={name} email={email} role={profile?.role} joinedDays={joinedDays} />

        <SettingsSection label={t('settings.profile')}>
          <SettingsRow
            icon={UserRound}
            label={t('settings.displayName')}
            value={name}
            onClick={open('name')}
          />
          <SettingsRow
            icon={AtSign}
            label={t('settings.email')}
            value={pendingEmail ? t('settings.emailPending', { email: pendingEmail }) : email}
            onClick={open('email')}
          />
          <SettingsRow
            icon={Clock}
            label={t('settings.timezone')}
            value={(profile?.timezone ?? browserTimezone()).replace(/_/g, ' ')}
            onClick={open('timezone')}
          />
        </SettingsSection>

        <SettingsSection label={t('settings.security')}>
          <SettingsRow
            icon={Lock}
            label={t('settings.password')}
            value={t('settings.change')}
            onClick={open('password')}
          />
          <SettingsRow icon={KeyRound} label={t('settings.passkeys')} onClick={open('passkeys')} />
        </SettingsSection>

        <SettingsSection label={t('settings.appearance')}>
          <div className="py-3">
            <Segmented
              aria-label={t('settings.theme')}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'dark', label: t('settings.dark'), icon: Moon },
                { value: 'coffee', label: t('settings.coffee'), icon: Coffee },
              ]}
            />
          </div>
          <SettingsRow
            icon={Languages}
            label={t('settings.language')}
            value={LOCALES.find((l) => l.value === locale)?.label}
            onClick={open('language')}
          />
          <SettingsToggleRow
            icon={Volume2}
            label={t('settings.soundEffects')}
            checked={sound}
            onCheckedChange={setSound}
          />
        </SettingsSection>

        <SettingsSection label={t('settings.notifications')}>
          <SettingsRow
            icon={reminderEnabled ? AlarmClock : Bell}
            label={t('settings.dailyReminder')}
            value={
              reminderEnabled
                ? reminderTimeLabel(profile?.reminder_hour ?? 8, profile?.reminder_minute ?? 0)
                : t('settings.off')
            }
            onClick={open('reminder')}
          />
          <SettingsRow
            icon={Newspaper}
            label={t('settings.weeklyDigest')}
            value={
              digestEnabled
                ? reminderTimeLabel(profile?.digest_hour ?? 18, profile?.digest_minute ?? 0)
                : t('settings.off')
            }
            onClick={open('digest')}
          />
        </SettingsSection>

        <SettingsSection label={t('settings.dataPrivacy')}>
          <SettingsToggleRow
            icon={BarChart3}
            label={t('settings.usageAnalytics')}
            hint={t('settings.usageAnalyticsHint')}
            checked={analytics}
            onCheckedChange={(on) => {
              setAnalytics(on)
              setAnalyticsEnabled(on)
            }}
          />
          <SettingsRow icon={Download} label={t('settings.exportData')} onClick={open('export')} />
        </SettingsSection>

        <SettingsSection label={t('settings.more')}>
          <SettingsRow
            icon={Trophy}
            label={t('settings.achievements')}
            onClick={() => navigate('/achievements')}
          />
          {supportVisible ? (
            <SettingsRow icon={Heart} label={t('settings.support')} onClick={open('support')} />
          ) : null}
        </SettingsSection>

        {isDesktopApp() ? (
          <SettingsSection label={t('settings.desktop')}>
            <SettingsRow
              icon={Laptop}
              label={t('settings.runInBackground')}
              value={runInBackground ? t('settings.on') : t('settings.off')}
              onClick={open('background')}
            />
          </SettingsSection>
        ) : null}

        {isStaff ? (
          <SettingsSection label={t('settings.admin')}>
            <SettingsRow
              icon={ShieldCheck}
              label={t('settings.adminConsole')}
              onClick={() => navigate('/admin')}
            />
          </SettingsSection>
        ) : null}

        <SignOutButton className="w-full lg:hidden" />

        <p className="label-mono text-center">
          {t('settings.versionLine', { version: APP_VERSION })}
        </p>
      </div>
      <Rail>
        <SettingsRail />
      </Rail>
      <SettingsSheets
        open={sheet}
        onClose={() => setSheet(null)}
        profile={profile}
        name={name}
        email={email}
      />
    </>
  )
}

export default SettingsPage
