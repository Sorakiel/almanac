import { useEffect } from 'react'
import { daylightGradient, daylightVeil, minutesOfDay } from '@/lib/daylight'
import { useThemeStore } from '@/stores/theme'

/** How often the glow is recomputed. Ten minutes is under the eye's threshold
 *  for the step it produces, and cheap enough to be uninteresting. */
const TICK_MS = 10 * 60 * 1000

/**
 * Keep the canvas glow in step with the local clock.
 *
 * Writes the two gradient variables the stylesheet already consumes, so no
 * component knows this exists — the light just changes under them. Recomputed
 * on a timer and whenever the tab comes back to the foreground, because a phone
 * that slept from morning to evening otherwise wakes up still showing dawn.
 */
export function useDaylight(): void {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const apply = () => {
      const minutes = minutesOfDay()
      const root = document.documentElement
      root.style.setProperty('--bg-gradient', daylightGradient(minutes, theme))
      root.style.setProperty('--bg-veil', daylightVeil(minutes, theme))
    }

    apply()
    const timer = setInterval(apply, TICK_MS)
    document.addEventListener('visibilitychange', apply)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', apply)
    }
  }, [theme])
}
