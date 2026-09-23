import type { QueryClient, QueryKey } from '@tanstack/react-query'

export interface OptimisticContext<T> {
  previous: T | undefined
}

/**
 * Optimistically rewrite one cached query and return the snapshot to roll
 * back to. In-flight fetches are cancelled first so a late response can't
 * overwrite the patch. `update` returning undefined leaves the cache as is.
 */
export async function patchQueryData<T>(
  client: QueryClient,
  queryKey: QueryKey,
  update: (previous: T | undefined) => T | undefined,
): Promise<OptimisticContext<T>> {
  await client.cancelQueries({ queryKey })
  const previous = client.getQueryData<T>(queryKey)
  const next = update(previous)
  if (next !== undefined) client.setQueryData<T>(queryKey, next)
  return { previous }
}

/** Undo a `patchQueryData` after the write failed. */
export function rollbackQueryData<T>(
  client: QueryClient,
  queryKey: QueryKey,
  context: OptimisticContext<T> | undefined,
): void {
  if (context?.previous !== undefined) client.setQueryData(queryKey, context.previous)
}
