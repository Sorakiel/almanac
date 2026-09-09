import { describe, expect, it } from 'vitest'
import { typewriterStep } from '@/hooks/useTypewriter'

describe('typewriterStep', () => {
  it('spends about the same total time on short and long lines', () => {
    const short = 20
    const long = 90
    const shortTotal = typewriterStep(short) * short
    const longTotal = typewriterStep(long) * long
    // Within a third of each other — the point is that neither makes you wait.
    expect(Math.abs(shortTotal - longTotal)).toBeLessThan(400)
  })

  it('never crawls on a very short line', () => {
    expect(typewriterStep(3)).toBeLessThanOrEqual(34)
  })

  it('never goes below the floor on a very long line', () => {
    expect(typewriterStep(1000)).toBeGreaterThanOrEqual(8)
  })

  it('handles an empty line without dividing by zero', () => {
    expect(Number.isFinite(typewriterStep(0))).toBe(true)
  })
})
