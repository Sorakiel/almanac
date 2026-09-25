import type { Profile } from '@/features/settings/api/profiles.api'
import { BackgroundSheet } from '@/features/settings/components/BackgroundSheet'
import { DigestSheet } from '@/features/settings/components/DigestSheet'
import { DisplayNameSheet } from '@/features/settings/components/DisplayNameSheet'
import { EmailSheet } from '@/features/settings/components/EmailSheet'
import { ExportSheet } from '@/features/settings/components/ExportSheet'
import { LanguageSheet } from '@/features/settings/components/LanguageSheet'
import { PasskeysSheet } from '@/features/settings/components/PasskeysSheet'
import { PasswordSheet } from '@/features/settings/components/PasswordSheet'
import { ReminderSheet } from '@/features/settings/components/ReminderSheet'
import { SupportSheet } from '@/features/settings/components/SupportSheet'
import { TimezoneSheet } from '@/features/settings/components/TimezoneSheet'
import { browserTimezone } from '@/lib/date'
import { useOpenKeys } from '@/hooks/useSheetKey'

export type SettingsSheetId =
  | 'name'
  | 'email'
  | 'password'
  | 'timezone'
  | 'passkeys'
  | 'language'
  | 'reminder'
  | 'digest'
  | 'export'
  | 'support'
  | 'background'

interface SettingsSheetsProps {
  open: SettingsSheetId | null
  onClose: () => void
  profile: Profile | null | undefined
  name: string
  email: string
}

/**
 * Every settings sheet, mounted all the time and driven by `open` alone so
 * each one plays its exit animation. Keyed per opening, so a form still
 * starts fresh from the current profile every time it opens.
 */
export function SettingsSheets({ open, onClose, profile, name, email }: SettingsSheetsProps) {
  const keyOf = useOpenKeys(open)
  const onOpenChange = (next: boolean) => {
    if (!next) onClose()
  }
  const reminderEnabled = profile?.reminder_enabled ?? false
  const digestEnabled = profile?.digest_enabled ?? false
  const at = (id: SettingsSheetId) => ({ open: open === id, onOpenChange })
  const key = (id: SettingsSheetId) => `${id}-${keyOf(id)}`

  return (
    <>
      <DisplayNameSheet key={key('name')} {...at('name')} current={name} />
      <EmailSheet key={key('email')} {...at('email')} current={email} />
      <PasswordSheet key={key('password')} {...at('password')} />
      <TimezoneSheet
        key={key('timezone')}
        {...at('timezone')}
        current={profile?.timezone ?? browserTimezone()}
      />
      <PasskeysSheet key={key('passkeys')} {...at('passkeys')} />
      <LanguageSheet key={key('language')} {...at('language')} />
      <ReminderSheet
        key={key('reminder')}
        {...at('reminder')}
        enabled={reminderEnabled}
        hour={profile?.reminder_hour ?? 8}
        minute={profile?.reminder_minute ?? 0}
        digestEnabled={digestEnabled}
      />
      <DigestSheet
        key={key('digest')}
        {...at('digest')}
        enabled={digestEnabled}
        day={profile?.digest_day ?? 0}
        hour={profile?.digest_hour ?? 18}
        minute={profile?.digest_minute ?? 0}
        reminderEnabled={reminderEnabled}
      />
      <ExportSheet key={key('export')} {...at('export')} />
      <SupportSheet key={key('support')} {...at('support')} />
      <BackgroundSheet key={key('background')} {...at('background')} />
    </>
  )
}
