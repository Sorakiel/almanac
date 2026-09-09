import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

/** Total time a line takes to type, however long it is. */
const TOTAL_MS = 850
/** Never slower than this per character — short lines shouldn't crawl. */
const MAX_STEP_MS = 34

/**
 * Milliseconds between characters for a line of `length`.
 *
 * Budget-based rather than fixed-rate: a one-line nudge and a three-line
 * observation both finish in about the same time, so the reader never waits on
 * the ticker. Exported for the test — the arithmetic is the whole behaviour.
 */
export function typewriterStep(length: number): number {
  if (length <= 0) return MAX_STEP_MS
  return Math.min(MAX_STEP_MS, Math.max(8, Math.round(TOTAL_MS / length)))
}

interface Typewriter {
  /** The characters revealed so far. */
  shown: string
  /** True until the last character lands — drives the caret. */
  typing: boolean
}

/**
 * Reveal `text` character by character.
 *
 * The app already writes in a terminal voice — mono type, `//` labels, a `$`
 * prompt, a blinking caret — so the narrator *typing* its observation is the
 * one place that voice can be more than a font choice. Reduced motion gets the
 * finished line immediately.
 *
 * The reset on a new line happens during render, not in an effect: setting
 * state from an effect body is both a lint error here and a wasted frame
 * showing the previous line's tail under the new line's identity.
 */
export function useTypewriter(text: string): Typewriter {
  const instant = prefersReducedMotion()
  const [state, setState] = useState({ text, shown: instant ? text : '' })

  if (state.text !== text) setState({ text, shown: instant ? text : '' })

  useEffect(() => {
    if (instant || text.length === 0) return
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setState({ text, shown: text.slice(0, i) })
      if (i >= text.length) window.clearInterval(id)
    }, typewriterStep(text.length))
    return () => window.clearInterval(id)
  }, [text, instant])

  const shown = state.text === text ? state.shown : ''
  return { shown, typing: shown.length < text.length }
}
