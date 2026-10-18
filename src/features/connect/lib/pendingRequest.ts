// The consent modal opens from `?oauth_request=<id>`, which the `oauth` edge
// function appends when an app sends the user here. A signed-out visitor loses
// the query on the way through /auth — and a magic link comes back in a new
// tab — so the id is parked in localStorage at boot and picked up once the
// signed-in shell mounts.

const PARAM = 'oauth_request'
const STORAGE_KEY = 'almanac.oauthRequest'
/** The server forgets an unanswered request after 10 minutes. */
const TTL_MS = 10 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Parked {
  id: string
  at: number
}

/** Move the id from the URL into storage and drop it from the address bar. */
export function capturePendingRequest(): void {
  const url = new URL(window.location.href)
  const id = url.searchParams.get(PARAM)
  if (!id) return
  url.searchParams.delete(PARAM)
  window.history.replaceState(window.history.state, '', url.toString())
  if (!UUID.test(id)) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, at: Date.now() } satisfies Parked))
  } catch {
    // Storage blocked: nothing to resume from; the app will time out and the
    // user starts sign-in again there.
  }
}

export function readPendingRequest(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parked = JSON.parse(raw) as Partial<Parked>
    if (typeof parked.id !== 'string' || typeof parked.at !== 'number') return null
    if (Date.now() - parked.at > TTL_MS) {
      clearPendingRequest()
      return null
    }
    return parked.id
  } catch {
    return null
  }
}

export function clearPendingRequest(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored, nothing to clear.
  }
}
