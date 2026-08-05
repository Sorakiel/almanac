import { useMutation } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import type { Profile } from '@/features/settings/api/profiles.api'
import { OFFLINE_MUTATION_KEYS, type UpdateProfileVariables } from '@/lib/offlineMutations'
import type { Database } from '@/types/database.generated'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

interface UseUpdateProfileResult {
  update: (patch: ProfileUpdate) => Promise<Profile>
  isPending: boolean
}

/**
 * Patch the signed-in user's own profile and refresh the cached row.
 * mutationFn and the cache patch live once in registerOfflineMutations
 * (src/lib/offlineMutations.ts) — see useToggleHabit for why.
 */
export function useUpdateProfile(): UseUpdateProfileResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const mutation = useMutation<Profile, Error, UpdateProfileVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.updateProfile,
  })

  return {
    update: (patch: ProfileUpdate) => mutation.mutateAsync({ userId, patch }),
    isPending: mutation.isPending,
  }
}
