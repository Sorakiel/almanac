import { onlineManager } from '@tanstack/react-query'

/** A write gets this many attempts in total before it is reported as failed. */
export const MAX_WRITE_ATTEMPTS = 5

const NETWORK_MESSAGE = /^(TypeError|FetchError):|Failed to fetch|NetworkError|Load failed/i
const NETWORK_ERROR_NAMES = new Set(['FunctionsFetchError', 'AuthRetryableFetchError'])

/**
 * True when a request never got an HTTP answer: offline, DNS, dropped
 * connection. Anything the server actually answered (4xx, RLS, conflicts) is
 * not one — retrying those just repeats the same refusal.
 *
 * postgrest-js does not rethrow a failed fetch: it resolves with a plain
 * `{ message: 'TypeError: Failed to fetch', code: '' }`, which the api layer
 * then throws. So this has to recognise the message, not only `instanceof`.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (typeof error !== 'object' || error === null) return false
  const { message, code, name } = error as { message?: unknown; code?: unknown; name?: unknown }
  if (typeof name === 'string' && NETWORK_ERROR_NAMES.has(name)) return true
  const unanswered = code === undefined || code === '' || code === null
  return unanswered && typeof message === 'string' && NETWORK_MESSAGE.test(message)
}

/** Mutation `retry`: network failures only, up to {@link MAX_WRITE_ATTEMPTS} attempts. */
export function retryNetworkErrors(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_WRITE_ATTEMPTS - 1 && isNetworkError(error)
}

/**
 * Seed React Query's online flag from the browser.
 *
 * `onlineManager` starts at `true` and only learns otherwise from an `offline`
 * event — which never fires for a page that *loads* offline. The app then
 * believed it was online: a write tapped after an offline cold start ran,
 * failed and rolled back, and a write restored from the previous session was
 * resumed straight into the same failure. Both are lost taps.
 */
export function syncOnlineStateFromBrowser(): void {
  onlineManager.setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
}
