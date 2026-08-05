import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { trackEvent } from '@/lib/analytics'
import {
  OFFLINE_MUTATION_KEYS,
  type DeleteReflectionVariables,
  type SaveReflectionVariables,
} from '@/lib/offlineMutations'
import type { Reflection } from '@/features/reflect/types'

interface SaveInput {
  /** Existing reflection id when editing today's entry, else null to create. */
  id: string | null
  date: string
  body: string
  quoteId: string | null
  mood: number | null
  energy: number | null
  dayRating: number | null
}

/**
 * Save (create or update today's) and delete reflections; invalidate on
 * settle. mutationFn and the settle invalidation live once in
 * registerOfflineMutations (src/lib/offlineMutations.ts) — see
 * useToggleHabit for why.
 */
export function useReflectionMutations() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const saveMutation = useMutation<Reflection, Error, SaveReflectionVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.saveReflection,
    onSuccess: () => trackEvent('reflection_saved'),
  })
  const save = {
    ...saveMutation,
    mutate: (
      input: SaveInput,
      options?: MutateOptions<Reflection, Error, SaveReflectionVariables>,
    ) => saveMutation.mutate({ ...input, userId }, options),
    mutateAsync: (input: SaveInput) => saveMutation.mutateAsync({ ...input, userId }),
  }

  const removeMutation = useMutation<void, Error, DeleteReflectionVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.deleteReflection,
  })
  const remove = {
    ...removeMutation,
    mutate: (id: string, options?: MutateOptions<void, Error, DeleteReflectionVariables>) =>
      removeMutation.mutate({ id, userId }, options),
    mutateAsync: (id: string) => removeMutation.mutateAsync({ id, userId }),
  }

  return { save, remove }
}
