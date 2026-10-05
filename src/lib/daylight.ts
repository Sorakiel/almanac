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
 * the light in the room: cold at night, the warm ember of dawn and dusk, a
 * softer warmth at midday — interpolated by the minute so it never visibly steps.
 *
 * Visible on purpose, at every hour. Dawn and dusk hold for hours, not minutes
 * (6–9 and 17–21), at the desktop prototype's `--p-glow` — its ember at 20 %
 * over #111113, its peach over #F2EADB at 50 % rather than 55 %: the extra
 * step took muted text to 4.48:1, just under AA. Midday keeps ~60 % of that
 * warmth, night turns a cool blue on dark and grey on paper. The prototype has
 * no clock; the plateaus, midday and night are ours (the owner asked for a glow
 * that reads all day). It still never costs contrast: body and muted text keep
 * AA over the brightest part of every anchor.
 */
const ANCHORS: Record<Theme, Anchor[]> = {
  dark: [
    { hour: 3, rgb: [28, 34, 58] }, // deep night — a distinct cold blue
    { hour: 6, rgb: [61, 41, 33] }, // dawn begins — the prototype's ember…
    { hour: 9, rgb: [61, 41, 33] }, // …and holds through the morning
    { hour: 13, rgb: [53, 38, 32] }, // midday — warm, a step quieter
    { hour: 17, rgb: [61, 41, 33] }, // dusk begins — the ember again…
    { hour: 21, rgb: [61, 41, 33] }, // …until it is properly evening
  ],
  coffee: [
    { hour: 3, rgb: [224, 222, 218] }, // night — the paper goes grey
    { hour: 6, rgb: [244, 217, 190] }, // dawn — the prototype's peach (a hair lighter, for AA)…
    { hour: 9, rgb: [244, 217, 190] }, // …held through the morning
    { hour: 13, rgb: [243, 223, 200] }, // midday — ~60 % of the peach
    { hour: 17, rgb: [244, 217, 190] }, // dusk — the peach again…
    { hour: 21, rgb: [244, 217, 190] }, // …until evening
  ],
}

/** Where the glow fades into the canvas: a touch wider than the prototype's 60 % / 46 %. */
const VEIL_STOP = '70%'
const GRADIENT_STOP = '55%'

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
  return `radial-gradient(120% 80% at 50% 0%, ${daylightColor(minutes, theme)} 0%, rgb(var(--color-bg)) ${GRADIENT_STOP})`
}

/**
 * The desktop glow: one radial pool rising above the window's top edge, the
 * desktop prototype's `--p-glow` shape. It spans the whole window, so the glass
 * sidebar and the workspace read as lit by the same light.
 */
export function daylightVeil(minutes: number, theme: Theme): string {
  return `radial-gradient(120% 60% at 50% -10%, ${daylightColor(minutes, theme)} 0%, rgb(var(--color-bg)) ${VEIL_STOP})`
}

/** Minutes since local midnight for an instant. */
export function minutesOfDay(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}
