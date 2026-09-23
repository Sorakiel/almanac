import { useMutationState } from '@tanstack/react-query'
import { OFFLINE_MUTATION_ROOT, habitIdOfWrite } from '@/lib/offlineMutations'

const isOfflineWrite = (mutationKey: readonly unknown[] | undefined): boolean =>
  mutationKey?.[0] === OFFLINE_MUTATION_ROOT

/** How many offline-durable writes have not settled yet — queued or in flight. */
export function usePendingWriteCount(): number {
  return useMutationState({
    filters: { status: 'pending', predicate: (m) => isOfflineWrite(m.options.mutationKey) },
    select: () => 1,
  }).length
}

/**
 * Habits with a write waiting for the network. Only *paused* writes count: an
 * online tap is pending for a few hundred milliseconds too, and a clock that
 * blinks on every tap would say "not saved" about something that is.
 */
export function usePendingHabitIds(): ReadonlySet<string> {
  const ids = useMutationState({
    filters: { status: 'pending', predicate: (m) => m.state.isPaused },
    select: (m) => habitIdOfWrite(m.options.mutationKey, m.state.variables),
  })
  return new Set(ids.filter((id): id is string => id !== null))
}
