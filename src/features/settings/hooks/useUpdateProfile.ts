import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { updateOwnProfile, type Profile } from '@/features/settings/api/profiles.api'
import type { Database } from '@/types/database.generated'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

interface UseUpdateProfileResult {
  update: (patch: ProfileUpdate) => Promise<Profile>
  isPending: boolean
}

/** Patch the signed-in user's own profile and refresh the cached row. */
export function useUpdateProfile(): UseUpdateProfileResult {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''

  const mutation = useMutation({
    mutationFn: (patch: ProfileUpdate) => updateOwnProfile(userId, patch),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile', userId], profile)
    },
  })

  return { update: mutation.mutateAsync, isPending: mutation.isPending }
}
