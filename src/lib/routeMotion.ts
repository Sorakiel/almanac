/**
 * How a route change should move (motion spec, HANDOFF §3):
 *  - `tab`  — between top-level screens: the new one rises 8px and fades in.
 *  - `push` — deeper into the app: slides in from the right over the previous
 *    screen, which drifts left 28% and dims.
 *  - `pop`  — back out: the reverse.
 * The kind is written to <html data-route-motion> while the View Transition
 * runs, and globals.css picks the animation from it.
 */
export type RouteMotion = 'tab' | 'push' | 'pop'

/** Screens reached from the tab bar or the sidebar — moving between them is a tab switch. */
const TOP_LEVEL = new Set([
  '/',
  '/progress',
  '/more',
  '/habits',
  '/train',
  '/flow',
  '/reflect',
  '/reading',
  '/friends',
])

function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

function isTopLevel(path: string): boolean {
  return TOP_LEVEL.has(path)
}

function isInside(child: string, parent: string): boolean {
  return parent === '/' ? child !== '/' : child.startsWith(`${parent}/`)
}

/** The motion for going from `from` to `to`; `back` is true for a history POP. */
export function routeMotion(from: string, to: string, back = false): RouteMotion {
  const a = normalize(from)
  const b = normalize(to)
  if (a === b) return 'tab'
  if (isTopLevel(a) && isTopLevel(b)) return 'tab'
  if (back) return 'pop'
  if (isInside(b, a)) return 'push'
  if (isInside(a, b)) return 'pop'
  if (isTopLevel(a)) return 'push'
  if (isTopLevel(b)) return 'pop'
  return 'push'
}

// Screens whose entrance cascade has already played this session. A screen is
// marked when it is left, so a visit keeps animating for as long as it lasts
// (a re-render mid-cascade must not cut it) and only the next visit is still.
const seen = new Set<string>()

export function hasEntered(path: string): boolean {
  return seen.has(normalize(path))
}

export function markEntered(path: string): void {
  seen.add(normalize(path))
}
