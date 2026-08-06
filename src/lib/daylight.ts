import type { Theme } from '@/stores/theme'

type Rgb = readonly [number, number, number]

interface Anchor {
  /** Hour of the local day this colour is at its purest. */
  hour: number
  rgb: Rgb
}

/**
 * The canvas glow through the day.
 *
 * The app answers "where am I now?", and the cheapest honest signal of *now* is
 * the light in the room. These are the four anchors the glow passes through —
 * cold before dawn, warm as it breaks, near-neutral at midday, amber at dusk —
 * interpolated by the minute so it never visibly steps.
 *
 * Kept deliberately dim. This sits behind everything the user reads, so it can
 * carry a mood but must never cost contrast; the night anchors in particular
 * are barely above the base canvas, because the people most likely to notice
 * this are the ones using the app in the dark.
 */
const ANCHORS: Record<Theme, Anchor[]> = {
  dark: [
    { hour: 3, rgb: [22, 24, 38] }, // deep night — cold, almost ink
    { hour: 7, rgb: [46, 31, 24] }, // dawn — the original warm ember
    { hour: 13, rgb: [33, 35, 40] }, // midday — neutral, the quietest of the four
    { hour: 19, rgb: [48, 26, 30] }, // dusk — red-violet
  ],
  coffee: [
    { hour: 3, rgb: [228, 224, 214] }, // night — the paper goes grey-blue
    { hour: 7, rgb: [246, 221, 199] }, // dawn — peach, as measured off the spec board
    { hour: 13, rgb: [250, 243, 230] }, // midday — brightest paper
    { hour: 19, rgb: [243, 217, 189] }, // dusk — amber
  ],
}

const DAY_MINUTES = 24 * 60

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

/**
 * The two anchors a moment sits between, and how far along it is.
 *
 * The day is a circle: 23:00 is between the dusk and the *next* night anchor,
 * so the search wraps rather than clamping — clamping is what makes this kind
 * of thing jump at midnight.
 */
function surrounding(minutes: number, anchors: Anchor[]): { from: Anchor; to: Anchor; t: number } {
  const sorted = [...anchors].sort((a, b) => a.hour - b.hour)
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]!
    const to = sorted[i + 1]!
    const start = from.hour * 60
    const end = to.hour * 60
    if (minutes >= start && minutes < end) {
      return { from, to, t: (minutes - start) / (end - start) }
    }
  }

  // Past the last anchor or before the first: the wrap-around segment.
  const start = last.hour * 60
  const span = DAY_MINUTES - start + first.hour * 60
  const elapsed = minutes >= start ? minutes - start : DAY_MINUTES - start + minutes
  return { from: last, to: first, t: elapsed / span }
}

/** The glow colour for a moment, as `rgb(r g b)`. */
export function daylightColor(minutes: number, theme: Theme): string {
  const { from, to, t } = surrounding(
    ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES,
    ANCHORS[theme],
  )
  const rgb = [0, 1, 2].map((i) => lerp(from.rgb[i]!, to.rgb[i]!, t))
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`
}

/**
 * The mobile canvas gradient: a radial rising from the top edge, exactly the
 * shape `tokens.css` ships — only its colour follows the clock now.
 */
export function daylightGradient(minutes: number, theme: Theme): string {
  const stop = theme === 'coffee' ? '48%' : '46%'
  return `radial-gradient(120% 80% at 50% 0%, ${daylightColor(minutes, theme)} 0%, rgb(var(--color-bg)) ${stop})`
}

/**
 * The desktop veil. The workspace frame is flat paper by measurement (Epic 0),
 * and that stays true: this is a 22%-tall wash at the very top, weak enough
 * that panels keep their edge against the canvas, present enough that the room
 * changes over a working day.
 */
export function daylightVeil(minutes: number, theme: Theme): string {
  return `linear-gradient(180deg, ${daylightColor(minutes, theme)} 0%, rgb(var(--color-bg)) 22%)`
}

/** Minutes since local midnight for an instant. */
export function minutesOfDay(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}
