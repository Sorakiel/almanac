import { EditProfileSheet } from '@/features/profile/components/EditProfileSheet'
import type { AvatarColor } from '@/features/profile/lib/avatarColors'
import { FeedbackSheet } from '@/features/modules/components/FeedbackSheet'
import type { Profile } from '@/features/settings/api/profiles.api'
import { SettingsSheets, type SettingsSheetId } from '@/features/settings/components/SettingsSheets'

export type ProfileSheetId = SettingsSheetId | 'edit' | 'feedback'

interface ProfileSheetsProps {
  open: ProfileSheetId | null
  onClose: () => void
  profile: Profile | undefined
  name: string
  email: string
  color: AvatarColor
}

/** The one sheet the profile has open: its own two, or one of Settings' forms. */
export function ProfileSheets({ open, onClose, profile, name, email, color }: ProfileSheetsProps) {
  const onOpenChange = (next: boolean) => {
    if (!next) onClose()
  }
  if (open === 'edit') {
    return (
      <EditProfileSheet open onOpenChange={onOpenChange} name={name} email={email} color={color} />
    )
  }
  if (open === 'feedback') return <FeedbackSheet open onOpenChange={onOpenChange} />
  return (
    <SettingsSheets open={open} onClose={onClose} profile={profile} name={name} email={email} />
  )
}
