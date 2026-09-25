import { EditProfileSheet } from '@/features/profile/components/EditProfileSheet'
import type { AvatarColor } from '@/features/profile/lib/avatarColors'
import { FeedbackSheet } from '@/features/modules/components/FeedbackSheet'
import type { Profile } from '@/features/settings/api/profiles.api'
import { SettingsSheets, type SettingsSheetId } from '@/features/settings/components/SettingsSheets'
import { useOpenKeys } from '@/hooks/useSheetKey'

export type ProfileSheetId = SettingsSheetId | 'edit' | 'feedback'

interface ProfileSheetsProps {
  open: ProfileSheetId | null
  onClose: () => void
  profile: Profile | undefined
  name: string
  email: string
  color: AvatarColor
}

/** The profile's own two sheets plus every Settings form — all kept mounted. */
export function ProfileSheets({ open, onClose, profile, name, email, color }: ProfileSheetsProps) {
  const keyOf = useOpenKeys(open)
  const onOpenChange = (next: boolean) => {
    if (!next) onClose()
  }
  const settingsOpen = open === 'edit' || open === 'feedback' ? null : open
  return (
    <>
      <EditProfileSheet
        key={`edit-${keyOf('edit')}`}
        open={open === 'edit'}
        onOpenChange={onOpenChange}
        name={name}
        email={email}
        color={color}
      />
      <FeedbackSheet
        key={`feedback-${keyOf('feedback')}`}
        open={open === 'feedback'}
        onOpenChange={onOpenChange}
      />
      <SettingsSheets
        open={settingsOpen}
        onClose={onClose}
        profile={profile}
        name={name}
        email={email}
      />
    </>
  )
}
