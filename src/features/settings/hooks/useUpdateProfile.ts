import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import type { Profile } from '@/features/settings/api/profiles.api'
import { OFFLINE_MUTATION_KEYS, type UpdateProfileVariables } from '@/lib/offlineMutations'

interface UseUpdateProfileResult {
  update: (patch: UpdateProfileVariables['patch']) => Promise<Profile>
  isPending: boolean
}

/** Patch the signed-in user's own profile and refresh the cached row. */
export function useUpdateProfile(): UseUpdateProfileResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const { mutateAsync, isPending } = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateProfile,
    (patch: UpdateProfileVariables['patch']) => ({ userId, patch }),
  )
  return { update: mutateAsync, isPending }
}
