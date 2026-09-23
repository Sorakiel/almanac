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
 * The one sheet Settings has open, if any. Each is mounted only while open so
 * its form state starts fresh from the current profile every time.
 */
export function SettingsSheets({ open, onClose, profile, name, email }: SettingsSheetsProps) {
  const onOpenChange = (next: boolean) => {
    if (!next) onClose()
  }
  const reminderEnabled = profile?.reminder_enabled ?? false
  const digestEnabled = profile?.digest_enabled ?? false

  switch (open) {
    case 'name':
      return <DisplayNameSheet open onOpenChange={onOpenChange} current={name} />
    case 'email':
      return <EmailSheet open onOpenChange={onOpenChange} current={email} />
    case 'password':
      return <PasswordSheet open onOpenChange={onOpenChange} />
    case 'timezone':
      return (
        <TimezoneSheet
          open
          onOpenChange={onOpenChange}
          current={profile?.timezone ?? browserTimezone()}
        />
      )
    case 'passkeys':
      return <PasskeysSheet open onOpenChange={onOpenChange} />
    case 'language':
      return <LanguageSheet open onOpenChange={onOpenChange} />
    case 'reminder':
      return (
        <ReminderSheet
          open
          onOpenChange={onOpenChange}
          enabled={reminderEnabled}
          hour={profile?.reminder_hour ?? 8}
          minute={profile?.reminder_minute ?? 0}
          digestEnabled={digestEnabled}
        />
      )
    case 'digest':
      return (
        <DigestSheet
          open
          onOpenChange={onOpenChange}
          enabled={digestEnabled}
          day={profile?.digest_day ?? 0}
          hour={profile?.digest_hour ?? 18}
          minute={profile?.digest_minute ?? 0}
          reminderEnabled={reminderEnabled}
        />
      )
    case 'export':
      return <ExportSheet open onOpenChange={onOpenChange} />
    case 'support':
      return <SupportSheet open onOpenChange={onOpenChange} />
    case 'background':
      return <BackgroundSheet open onOpenChange={onOpenChange} />
    default:
      return null
  }
}
