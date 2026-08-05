import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { OFFLINE_MUTATION_KEYS, type ToggleFreezeVariables } from '@/lib/offlineMutations'

interface ToggleFreezeArgs {
  habitId: string
  /** The day to protect/unprotect (defaults to today). */
  date?: string
  /** True to add protection, false to remove it. */
  freeze: boolean
}

/**
 * Freeze or unfreeze a day for a habit (заморозка). A frozen due-day is treated
 * as a skip in the streak calc, so a protected miss keeps the streak alive.
 *
 * mutationFn and the settle invalidation live in registerOfflineMutations
 * (src/lib/offlineMutations.ts) — see useToggleHabit for why.
 */
export function useToggleFreeze() {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  const mutation = useMutation<void, Error, ToggleFreezeVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.toggleFreeze,
  })

  const withDefaults = (args: ToggleFreezeArgs): ToggleFreezeVariables => ({
    userId,
    habitId: args.habitId,
    date: args.date ?? dateKey,
    freeze: args.freeze,
  })

  return {
    ...mutation,
    mutate: (args: ToggleFreezeArgs, options?: MutateOptions<void, Error, ToggleFreezeVariables>) =>
      mutation.mutate(withDefaults(args), options),
    mutateAsync: (args: ToggleFreezeArgs) => mutation.mutateAsync(withDefaults(args)),
  }
}
