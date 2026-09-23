import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'

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
 */
export function useToggleFreeze() {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleFreeze,
    ({ habitId, date = dateKey, freeze }: ToggleFreezeArgs) => ({ userId, habitId, date, freeze }),
  )
}
