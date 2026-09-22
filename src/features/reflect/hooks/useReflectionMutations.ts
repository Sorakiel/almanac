import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { OFFLINE_MUTATION_KEYS, type SaveReflectionVariables } from '@/lib/offlineMutations'

/** Save (create or update today's) and delete reflections; invalidate on settle. */
export function useReflectionMutations() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  // `id` is today's existing reflection when editing, else null to create.
  const save = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.saveReflection,
    (input: Omit<SaveReflectionVariables, 'userId'>) => ({ ...input, userId }),
    { onSuccess: () => trackEvent('reflection_saved') },
  )
  const remove = useOfflineMutation(OFFLINE_MUTATION_KEYS.deleteReflection, (id: string) => ({
    id,
    userId,
  }))

  return { save, remove }
}
