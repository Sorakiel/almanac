import posthog from 'posthog-js'
import { usePrefsStore } from '@/stores/prefs'

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

/**
 * The events worth naming. Deliberately few: the question this exists to answer
 * is "which of the nine modules do five people actually use", and a long tail of
 * half-instrumented events answers nothing while making the data harder to read.
 */
export type AnalyticsEvent =
  | 'habit_completed'
  | 'habit_created'
  | 'workout_finished'
  | 'reading_progress_logged'
  | 'reflection_saved'
  | 'focus_session_finished'

/**
 * Properties are ids, counts and enums only — never names, titles or bodies.
 * This app is shared with friends, and a habit name ("therapy", "no drinking")
 * is exactly the kind of thing that must not leave the device.
 */
type EventProps = Record<string, number | boolean | string | undefined>

let started = false

/** Whether analytics may run at all: configured, opted in, and not DNT. */
function allowed(): boolean {
  if (KEY === undefined || KEY === '') return false
  if (navigator.doNotTrack === '1') return false
  return usePrefsStore.getState().analytics
}

/**
 * Start PostHog, once, if allowed.
 *
 * Autocapture and session recording stay **off**. Both would sweep up DOM text,
 * and in this app the DOM text is the user's habit names, book titles and
 * journal entries. Everything reported here is explicit.
 */
export function initAnalytics(): void {
  if (started || !allowed()) return
  started = true
  posthog.init(KEY!, {
    api_host: HOST,
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    capture_pageview: false, // routed manually — see trackPageView
    capture_pageleave: true,
    person_profiles: 'identified_only',
    persistence: 'localStorage',
    sanitize_properties: sanitizeProperties,
  })
}

/** URL-shaped properties PostHog fills in from `location` behind our back. */
const URL_PROPS = [
  '$current_url',
  '$pathname',
  '$referrer',
  '$initial_current_url',
  '$initial_pathname',
  '$initial_referrer',
]

/**
 * Last line of defence on every outgoing event.
 *
 * `trackPageView` normalises the path it sends, but PostHog attaches its own
 * copies of the URL read straight from `location` — raw row ids and all. Rather
 * than trusting each call site to be careful, scrub the URL properties centrally
 * so a future screen that puts something identifying in a path cannot leak it by
 * default.
 */
export function sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...properties }
  for (const prop of URL_PROPS) {
    const value = clean[prop]
    if (typeof value === 'string') clean[prop] = normaliseUrl(value)
  }
  return clean
}

/** Normalise ids in a full URL or a bare path, dropping any query string. */
function normaliseUrl(value: string): string {
  const [withoutQuery] = value.split('?')
  return normalisePath(withoutQuery ?? '')
}

/** Tie events to a Supabase user id. No email, no display name. */
export function identifyUser(userId: string): void {
  if (!started) return
  posthog.identify(userId)
}

/** Forget the user on sign-out so a shared device doesn't merge two people. */
export function resetAnalytics(): void {
  if (!started) return
  posthog.reset()
}

/**
 * A route view. The path is normalised — `/habits/<uuid>` becomes
 * `/habits/:id` — so per-module usage aggregates instead of scattering across
 * thousands of one-off paths (and so row ids never leave as URLs).
 */
let lastPath: string | null = null

export function trackPageView(pathname: string): void {
  if (!started) return
  const path = normalisePath(pathname)
  // The data router notifies on every state transition, not just completed
  // navigations, so the same path arrives several times per move.
  if (path === lastPath) return
  lastPath = path
  posthog.capture('$pageview', { $current_url: path })
}

export function trackEvent(event: AnalyticsEvent, props?: EventProps): void {
  if (!started) return
  posthog.capture(event, props)
}

/** Report a crash. Called by the error boundary and the global handlers. */
export function trackError(error: unknown, context?: string): void {
  if (!started) return
  const err = error instanceof Error ? error : new Error(String(error))
  posthog.captureException(err, context !== undefined ? { context } : undefined)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Replace id segments with `:id` so paths group by screen. */
export function normalisePath(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (UUID.test(segment) ? ':id' : segment))
    .join('/')
}

/**
 * Turn analytics off mid-session. PostHog keeps its own opt-out flag, so this
 * takes effect immediately rather than at the next reload.
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  if (!started) {
    if (enabled) initAnalytics()
    return
  }
  if (enabled) posthog.opt_in_capturing()
  else posthog.opt_out_capturing()
}
