import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Download,
  Globe,
  Laptop,
  LayoutGrid,
  Newspaper,
  ShieldCheck,
  Sun,
  Timer,
  Volume2,
} from 'lucide-react'
import { AccountSettings } from '@/features/profile/components/AccountSettings'
import { ListSwitch } from '@/features/profile/components/ListSwitch'
import { SettingsGroup } from '@/features/profile/components/SettingsGroup'
import { SettingsItem } from '@/features/profile/components/SettingsItem'
import { ThemeSegment } from '@/features/profile/components/ThemeSegment'
import type { ProfileSheetId } from '@/features/profile/components/ProfileSheets'
import type { Profile } from '@/features/settings/api/profiles.api'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { LOCALES } from '@/i18n'
import { browserTimezone } from '@/lib/date'
import { weekdayLabels } from '@/lib/dateLocale'
import { isDesktopApp } from '@/lib/platform/desktop'
import { useDesktopStore } from '@/stores/desktop'
import { usePrefsStore } from '@/stores/prefs'
import { useT } from '@/hooks/useT'
import { useTheme } from '@/hooks/useTheme'

interface ProfileSettingsProps {
  profile: Profile | undefined
  email: string
  supportVisible: boolean
  onOpen: (sheet: ProfileSheetId) => void
}

/** "Europe/Moscow" → "Moscow": the city is what people recognise. */
function zoneCity(zone: string): string {
  return (zone.split('/').pop() ?? zone).replace(/_/g, ' ')
}

/** Every setting, as grouped lists — what used to be the Settings screen. */
export function ProfileSettings({ profile, email, supportVisible, onOpen }: ProfileSettingsProps) {
  const navigate = useNavigate()
  const { t, locale } = useT()
  const { preference, setTheme } = useTheme()
  const sound = usePrefsStore((s) => s.sound)
  const setSound = usePrefsStore((s) => s.setSound)
  const runInBackground = useDesktopStore((s) => s.runInBackground)
  const isStaff = profile?.role === 'admin' || profile?.role === 'owner'
  const off = t('settings.off')
  const reminder = profile?.reminder_enabled
    ? reminderTimeLabel(profile.reminder_hour, profile.reminder_minute)
    : off
  const digest = profile?.digest_enabled
    ? `${weekdayLabels(locale)[profile.digest_day] ?? ''}, ${reminderTimeLabel(profile.digest_hour, profile.digest_minute)}`
    : off

  return (
    <div className="grid grid-cols-1 gap-6">
      <SettingsGroup title={t('profile.appearance')}>
        <SettingsItem
          icon={Sun}
          tile="amber"
          label={t('profile.theme')}
          control={<ThemeSegment value={preference} onChange={setTheme} />}
        />
        <SettingsItem
          icon={Volume2}
          tile="ember"
          label={t('profile.sound')}
          control={
            <ListSwitch
              checked={sound}
              onCheckedChange={setSound}
              aria-label={t('profile.sound')}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title={t('profile.notifications')}>
        <SettingsItem
          icon={Bell}
          tile="rust"
          label={t('profile.reminder')}
          value={reminder}
          onClick={() => onOpen('reminder')}
        />
        <SettingsItem
          icon={Newspaper}
          tile="teal"
          label={t('profile.digest')}
          value={digest}
          onClick={() => onOpen('digest')}
        />
      </SettingsGroup>

      <SettingsGroup title={t('profile.app')}>
        <SettingsItem
          icon={LayoutGrid}
          label={t('profile.modules')}
          onClick={() => navigate('/more')}
        />
        <SettingsItem
          icon={Globe}
          tile="violet"
          label={t('settings.language')}
          value={LOCALES.find((l) => l.value === locale)?.label}
          onClick={() => onOpen('language')}
        />
        <SettingsItem
          icon={Timer}
          tile="pine"
          label={t('settings.timezone')}
          value={zoneCity(profile?.timezone ?? browserTimezone())}
          onClick={() => onOpen('timezone')}
        />
        <SettingsItem
          icon={Download}
          tile="ochre"
          label={t('settings.exportData')}
          value={t('profile.exportValue')}
          onClick={() => onOpen('export')}
        />
        {isDesktopApp() ? (
          <SettingsItem
            icon={Laptop}
            label={t('settings.runInBackground')}
            value={runInBackground ? t('settings.on') : off}
            onClick={() => onOpen('background')}
          />
        ) : null}
        {isStaff ? (
          <SettingsItem
            icon={ShieldCheck}
            tile="blue"
            label={t('settings.adminConsole')}
            onClick={() => navigate('/admin')}
          />
        ) : null}
      </SettingsGroup>

      <AccountSettings email={email} supportVisible={supportVisible} onOpen={onOpen} />
    </div>
  )
}
