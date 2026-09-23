import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import {
  changePassword,
  requestEmailChange,
  updateAuthDisplayName,
} from '@/features/settings/api/account.api'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'

interface UseAccountActionsResult {
  rename: UseMutationResult<void, Error, string>
  changeEmail: UseMutationResult<string | null, Error, string>
  setPassword: UseMutationResult<void, Error, string>
}

/**
 * Profile + credential changes for the Settings "Profile" and "Security"
 * sections. Online-only on purpose: auth writes must hit the server now, and a
 * queued password change replaying later would be a surprise, not a feature.
 */
export function useAccountActions(): UseAccountActionsResult {
  const { update } = useUpdateProfile()

  const rename = useMutation<void, Error, string>({
    mutationFn: async (name) => {
      // The profile row is what friends see; the metadata is what this device greets.
      await update({ display_name: name })
      await updateAuthDisplayName(name)
    },
  })
  const changeEmail = useMutation<string | null, Error, string>({ mutationFn: requestEmailChange })
  const setPassword = useMutation<void, Error, string>({ mutationFn: changePassword })
  return { rename, changeEmail, setPassword }
}
