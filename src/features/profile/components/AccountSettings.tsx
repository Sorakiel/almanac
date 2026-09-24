import { AtSign, BarChart3, Heart, KeyRound, Lock, MessageSquare } from 'lucide-react'
import { ListSwitch } from '@/features/profile/components/ListSwitch'
import { SettingsGroup } from '@/features/profile/components/SettingsGroup'
import { SettingsItem } from '@/features/profile/components/SettingsItem'
import { SignOutItem } from '@/features/profile/components/SignOutItem'
import type { ProfileSheetId } from '@/features/profile/components/ProfileSheets'
import { setAnalyticsEnabled } from '@/lib/analytics'
import { usePrefsStore } from '@/stores/prefs'
import { useT } from '@/hooks/useT'

interface AccountSettingsProps {
  email: string
  supportVisible: boolean
  onOpen: (sheet: ProfileSheetId) => void
}

/** "ale…@almanac.app" — enough to recognise, short enough for the row. */
function maskEmail(email: string): string {
  return email.replace(/^(.{3}).+@/, '$1…@')
}

/** The lower half of the settings: sign-in, privacy, the project, and «Выйти». */
export function AccountSettings({ email, supportVisible, onOpen }: AccountSettingsProps) {
  const { t } = useT()
  const analytics = usePrefsStore((s) => s.analytics)
  const setAnalytics = usePrefsStore((s) => s.setAnalytics)

  return (
    <>
      <SettingsGroup title={t('profile.account')}>
        <SettingsItem
          icon={AtSign}
          tile="blue"
          label={t('settings.email')}
          value={email ? maskEmail(email) : undefined}
          onClick={() => onOpen('email')}
        />
        <SettingsItem
          icon={KeyRound}
          tile="green"
          label={t('profile.passkey')}
          onClick={() => onOpen('passkeys')}
        />
        <SettingsItem
          icon={Lock}
          label={t('settings.password')}
          onClick={() => onOpen('password')}
        />
      </SettingsGroup>

      <SettingsGroup title={t('profile.privacy')} note={t('profile.analyticsNote')}>
        <SettingsItem
          icon={BarChart3}
          label={t('profile.analytics')}
          control={
            <ListSwitch
              checked={analytics}
              onCheckedChange={(on) => {
                setAnalytics(on)
                setAnalyticsEnabled(on)
              }}
              aria-label={t('profile.analytics')}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup>
        {supportVisible ? (
          <SettingsItem
            icon={Heart}
            tile="ember"
            label={t('profile.support')}
            onClick={() => onOpen('support')}
          />
        ) : null}
        <SettingsItem
          icon={MessageSquare}
          tile="teal"
          label={t('profile.feedback')}
          onClick={() => onOpen('feedback')}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SignOutItem />
      </SettingsGroup>
    </>
  )
}
