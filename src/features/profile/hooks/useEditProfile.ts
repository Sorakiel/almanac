import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { updateAuthDisplayName } from '@/features/settings/api/account.api'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import type { AvatarColor } from '@/features/profile/lib/avatarColors'

export interface EditProfileInput {
  name: string
  color: AvatarColor
  /** Only a changed name touches the auth metadata — that write is online-only. */
  nameChanged: boolean
}

/**
 * Save "Изменить профиль": one patch to the profile row (what friends see),
 * then the name into the session metadata the greeting still reads.
 */
export function useEditProfile(): UseMutationResult<void, Error, EditProfileInput> {
  const { update } = useUpdateProfile()
  return useMutation<void, Error, EditProfileInput>({
    mutationFn: async ({ name, color, nameChanged }) => {
      await update(
        nameChanged ? { avatar_color: color, display_name: name } : { avatar_color: color },
      )
      if (nameChanged) await updateAuthDisplayName(name)
    },
  })
}
