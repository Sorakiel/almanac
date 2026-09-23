import {
  useMutation,
  type MutateOptions,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import type { OfflineKey } from '@/lib/offlineMutations'

type Options<TData, TVariables, TContext> = Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  'mutationKey' | 'mutationFn'
>

export type OfflineMutation<TData, TVariables, TInput, TContext = unknown> = Omit<
  UseMutationResult<TData, Error, TVariables, TContext>,
  'mutate' | 'mutateAsync'
> & {
  mutate: (input: TInput, options?: MutateOptions<TData, Error, TVariables, TContext>) => void
  mutateAsync: (input: TInput) => Promise<TData>
}

/**
 * A live handle on a write registered in `registerOfflineMutations`. It
 * inherits `mutationFn` and the settle invalidation from the key — never
 * redeclare them here, or the live and the resumed write drift apart.
 *
 * Callers pass only what they know; `toVariables` adds the hook's own state
 * (userId, today) so the persisted variables stay self-contained — a resume
 * after a cold start runs with no component mounted and no closures.
 */
export function useOfflineMutation<TData, TVariables, TInput, TContext = unknown>(
  key: OfflineKey<TData, TVariables>,
  toVariables: (input: TInput) => TVariables,
  options?: Options<TData, TVariables, TContext>,
): OfflineMutation<TData, TVariables, TInput, TContext> {
  const mutation = useMutation<TData, Error, TVariables, TContext>({ ...options, mutationKey: key })
  return {
    ...mutation,
    mutate: (input, mutateOptions) => mutation.mutate(toVariables(input), mutateOptions),
    mutateAsync: (input) => mutation.mutateAsync(toVariables(input)),
  }
}
