import { prefersReducedMotion } from '@/lib/motion'

/** One dot of a burst: where it flies to, its size and colour. */
export interface BurstDot {
  dx: number
  dy: number
  size: number
  color: string
}

const DOTS = 12
const MIN_DISTANCE = 46
const SPREAD = 34
// Removed a beat after the 0.8 s flight so the last frame is never cut.
const LIFETIME_MS = 900

export const BURST_COLORS = {
  default: ['rgb(var(--color-teal))', 'rgb(var(--color-accent))', 'rgb(var(--color-amber))'],
  reading: ['rgb(var(--color-amber))', '#E8C27A', 'rgb(var(--color-accent))'],
  medal: [
    'rgb(var(--color-amber))',
    'rgb(var(--color-teal))',
    'rgb(var(--color-accent))',
    'rgb(var(--color-success))',
  ],
} as const

/**
 * The prototype's `MOD.burst` geometry: 12 dots evenly around a circle with a
 * little angular jitter, flying 46–80 px, sized 4 / 6 / 8 px in turn.
 * `random` is injectable so the maths is testable.
 */
export function burstDots(
  colors: readonly string[],
  random: () => number = Math.random,
): BurstDot[] {
  return Array.from({ length: DOTS }, (_, i) => {
    const angle = (i / DOTS) * Math.PI * 2 + random() * 0.4
    const distance = MIN_DISTANCE + random() * SPREAD
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance),
      size: 4 + (i % 3) * 2,
      color: colors[i % colors.length] ?? 'currentColor',
    }
  })
}

/**
 * Sparkle burst out of `el` — a completion made physical, not confetti.
 * No-op under reduced motion.
 */
export function burst(el: Element | null, colors: readonly string[] = BURST_COLORS.default): void {
  if (!el || prefersReducedMotion()) return
  const rect = el.getBoundingClientRect()
  const host = document.createElement('div')
  host.className = 'burst'
  host.setAttribute('aria-hidden', 'true')
  host.style.left = `${rect.left + rect.width / 2}px`
  host.style.top = `${rect.top + rect.height / 2}px`
  for (const dot of burstDots(colors)) {
    const i = document.createElement('i')
    i.style.setProperty('--dx', `${dot.dx}px`)
    i.style.setProperty('--dy', `${dot.dy}px`)
    i.style.width = `${dot.size}px`
    i.style.height = `${dot.size}px`
    i.style.background = dot.color
    host.appendChild(i)
  }
  document.body.appendChild(host)
  window.setTimeout(() => host.remove(), LIFETIME_MS)
}
