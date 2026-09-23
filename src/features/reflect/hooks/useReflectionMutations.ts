import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS, type SaveReflectionVariables } from '@/lib/offlineMutations'
import { reflectKeys } from '@/features/reflect/hooks/queryKeys'
import type { Reflection } from '@/features/reflect/types'
import { toUserError } from '@/lib/userError'

/** Newest calendar day first, as `fetchReflections` orders them. */
function byDateDesc(a: Reflection, b: Reflection): number {
  return b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
}

/**
 * Save (create or update today's), delete and restore reflections. Delete and
 * its Undo patch the list first, so the card leaves and returns on the tap —
 * which is also why their failures are toasted here: the card that fired them
 * is already unmounted, and a per-call `onError` would never run.
 */
export function useReflectionMutations() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const key = reflectKeys.all(userId)

  // `id` is today's existing reflection when editing, else null to create.
  const save = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.saveReflection,
    (input: Omit<SaveReflectionVariables, 'userId'>) => ({ ...input, userId }),
    { onSuccess: () => trackEvent('reflection_saved') },
  )
  const remove = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.deleteReflection,
    (id: string) => ({ id, userId }),
    {
      onMutate: ({ id }) =>
        patchQueryData<Reflection[]>(queryClient, key, (previous) =>
          previous?.filter((r) => r.id !== id),
        ),
      onError: (error, _vars, context) => {
        rollbackQueryData(queryClient, key, context)
        toast.error(toUserError(error, t, 'reflect.deleteFailed'))
      },
    },
  )
  /** The Undo of `remove`: takes the row itself so it reappears before the write lands. */
  const restore = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.restoreReflection,
    (reflection: Reflection) => ({ reflection, userId }),
    {
      onMutate: ({ reflection }) =>
        patchQueryData<Reflection[]>(queryClient, key, (previous) =>
          previous
            ? [...previous.filter((r) => r.id !== reflection.id), reflection].sort(byDateDesc)
            : undefined,
        ),
      onError: (error, _vars, context) => {
        rollbackQueryData(queryClient, key, context)
        toast.error(toUserError(error, t, 'reflect.restoreFailed'))
      },
    },
  )

  return { save, remove, restore }
}
