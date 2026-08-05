import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlarmClock,
  BarChart3,
  Bell,
  ChevronRight,
  Clock,
  Coffee,
  Download,
  Languages,
  Heart,
  Laptop,
  Moon,
  ShieldCheck,
  Trophy,
  Volume2,
  type LucideIcon,
} from 'lucide-react'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { Avatar } from '@/components/common/Avatar'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { Rail } from '@/components/common/desktop/rail'
import { SettingsRail } from '@/features/settings/components/SettingsRail'
import { TimezoneSheet } from '@/features/settings/components/TimezoneSheet'
import { ReminderSheet } from '@/features/settings/components/ReminderSheet'
import { BackgroundSheet } from '@/features/settings/components/BackgroundSheet'
import { SupportSheet } from '@/features/settings/components/SupportSheet'
import { LanguageSheet } from '@/features/settings/components/LanguageSheet'
import { SignOutButton } from '@/features/settings/components/SignOutButton'
import { ExportSheet } from '@/features/settings/components/ExportSheet'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { isDesktopApp } from '@/lib/desktop'
import { APP_VERSION } from '@/lib/version'
import { LOCALES } from '@/i18n'
import { useDesktopStore } from '@/stores/desktop'
import { setAnalyticsEnabled } from '@/lib/analytics'
import { usePrefsStore } from '@/stores/prefs'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useTheme } from '@/hooks/useTheme'
import { useToday } from '@/hooks/useToday'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSupportConfig } from '@/features/settings/hooks/useSupportConfig'
import { browserTimezone } from '@/lib/date'

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
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [backgroundOpen, setBackgroundOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const runInBackground = useDesktopStore((s) => s.runInBackground)
  const showDesktop = isDesktopApp()

  if (status === 'anonymous') return <Navigate to="/auth" replace />

  const name = (user?.user_metadata.display_name as string | undefined) ?? 'Almanac user'
  const email = user?.email ?? ''
  const joinedDays = user?.created_at
    ? Math.max(
        1,
        Math.floor(
          (new Date(dateKey).getTime() - new Date(user.created_at).getTime()) / 86_400_000,
        ),
      )
    : 0
  const supportVisible = Boolean(supportConfig?.enabled && supportConfig.methods.length > 0)
  const reminderEnabled = profile?.reminder_enabled ?? false
  const reminderHour = profile?.reminder_hour ?? 8
  const reminderMinute = profile?.reminder_minute ?? 0

  const handleAnalyticsChange = (on: boolean) => {
    setAnalytics(on)
    setAnalyticsEnabled(on)
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:mx-auto lg:max-w-[760px]">
        <header className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl">{name}</h1>
            <p className="truncate text-sm text-muted">{email}</p>
            <Tag tone="accent" className="mt-1.5">
              ◇ {profile?.role && profile.role !== 'user' ? profile.role : t('settings.member')} ·{' '}
              {t('settings.joined', { count: joinedDays })}
            </Tag>
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <SectionLabel>{t('settings.appearance')}</SectionLabel>
          <Segmented
            aria-label={t('settings.theme')}
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'dark', label: t('settings.dark'), icon: Moon },
              { value: 'coffee', label: t('settings.coffee'), icon: Coffee },
            ]}
          />
          <label className="flex items-center justify-between rounded-tile border bg-surface px-4 py-3">
            <span className="flex items-center gap-3">
              <Volume2 className="h-[18px] w-[18px] text-muted-strong" aria-hidden="true" />
              <span className="text-[15px]">{t('settings.soundEffects')}</span>
            </span>
            <Switch
              checked={sound}
              onCheckedChange={setSound}
              aria-label={t('settings.soundEffects')}
            />
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>{t('settings.privacy')}</SectionLabel>
          <label className="flex items-center justify-between gap-4 rounded-tile border bg-surface px-4 py-3">
            <span className="flex items-start gap-3">
              <BarChart3
                className="mt-0.5 h-[18px] w-[18px] flex-none text-muted-strong"
                aria-hidden="true"
              />
              <span className="flex flex-col">
                <span className="text-[15px]">{t('settings.usageAnalytics')}</span>
                <span className="text-xs text-muted">{t('settings.usageAnalyticsHint')}</span>
              </span>
            </span>
            <Switch
              checked={analytics}
              onCheckedChange={handleAnalyticsChange}
              aria-label={t('settings.usageAnalytics')}
            />
          </label>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('settings.you')}</SectionLabel>
          <div className="flex flex-col">
            <Row
              icon={Trophy}
              label={t('settings.achievements')}
              onClick={() => navigate('/achievements')}
            />
            {supportVisible ? (
              <Row
                icon={Heart}
                label={t('settings.support')}
                onClick={() => setSupportOpen(true)}
              />
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('settings.account')}</SectionLabel>
          <div className="flex flex-col">
            <Row
              icon={Clock}
              label={t('settings.timezone')}
              value={(profile?.timezone ?? browserTimezone()).replace(/_/g, ' ')}
              onClick={() => setTimezoneOpen(true)}
            />
            <Row
              icon={reminderEnabled ? AlarmClock : Bell}
              label={t('settings.dailyReminder')}
              value={
                reminderEnabled
                  ? reminderTimeLabel(reminderHour, reminderMinute)
                  : t('settings.off')
              }
              onClick={() => setReminderOpen(true)}
            />
            <Row
              icon={Languages}
              label={t('settings.language')}
              value={LOCALES.find((l) => l.value === locale)?.label}
              onClick={() => setLanguageOpen(true)}
            />
            <Row
              icon={Download}
              label={t('settings.exportData')}
              onClick={() => setExportOpen(true)}
            />
          </div>
        </section>

        {showDesktop ? (
          <section className="flex flex-col gap-2">
            <SectionLabel>{t('settings.desktop')}</SectionLabel>
            <div className="flex flex-col">
              <Row
                icon={Laptop}
                label={t('settings.runInBackground')}
                value={runInBackground ? t('settings.on') : t('settings.off')}
                onClick={() => setBackgroundOpen(true)}
              />
            </div>
          </section>
        ) : null}

        {profile?.role === 'admin' || profile?.role === 'owner' ? (
          <section className="flex flex-col gap-1">
            <SectionLabel className="mb-2">{t('settings.admin')}</SectionLabel>
            <Row
              icon={ShieldCheck}
              label={t('settings.adminConsole')}
              onClick={() => navigate('/admin')}
            />
          </section>
        ) : null}

        <SignOutButton className="w-full lg:hidden" />

        <p className="label-mono text-center">ALMANAC v{APP_VERSION} · ◇</p>
      </div>
      <Rail>
        <SettingsRail />
      </Rail>
      {timezoneOpen ? (
        <TimezoneSheet
          open
          onOpenChange={setTimezoneOpen}
          current={profile?.timezone ?? browserTimezone()}
        />
      ) : null}
      {reminderOpen ? (
        <ReminderSheet
          open
          onOpenChange={setReminderOpen}
          enabled={reminderEnabled}
          hour={reminderHour}
          minute={reminderMinute}
        />
      ) : null}
      {backgroundOpen ? <BackgroundSheet open onOpenChange={setBackgroundOpen} /> : null}
      {supportOpen ? <SupportSheet open onOpenChange={setSupportOpen} /> : null}
      {exportOpen ? <ExportSheet open onOpenChange={setExportOpen} /> : null}
      {languageOpen ? <LanguageSheet open onOpenChange={setLanguageOpen} /> : null}
    </>
  )
}

interface RowProps {
  icon: LucideIcon
  label: string
  value?: string
  onClick: () => void
}

function Row({ icon: Icon, label, value, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 border-t border-border/10 px-1 py-3.5 text-left transition-colors first:border-t-0 hover:text-accent"
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? <span className="label-mono normal-case tracking-normal">{value}</span> : null}
      <ChevronRight className="h-4 w-4 text-muted-strong" aria-hidden="true" />
    </button>
  )
}

export default SettingsPage
