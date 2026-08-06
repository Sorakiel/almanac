import { describe, expect, it } from 'vitest'
import { daylightColor, daylightGradient, minutesOfDay } from '@/lib/daylight'

function channels(color: string): number[] {
  return color
    .replace(/rgb\(|\)/g, '')
    .split(' ')
    .map(Number)
}

describe('daylightColor', () => {
  it('lands exactly on an anchor at its hour', () => {
    expect(channels(daylightColor(7 * 60, 'dark'))).toEqual([46, 31, 24])
    expect(channels(daylightColor(13 * 60, 'coffee'))).toEqual([250, 243, 230])
  })

  it('interpolates between anchors', () => {
    const [r] = channels(daylightColor(10 * 60, 'dark'))
    // Halfway from dawn (46) to midday (33).
    expect(r).toBeGreaterThan(33)
    expect(r).toBeLessThan(46)
  })

  it('wraps across midnight instead of jumping', () => {
    const before = channels(daylightColor(23 * 60 + 59, 'dark'))
    const after = channels(daylightColor(0, 'dark'))
    // One minute apart must not move a channel by more than a step or two.
    before.forEach((v, i) => expect(Math.abs(v - after[i]!)).toBeLessThanOrEqual(2))
  })

  it('handles out-of-range minutes by wrapping the day', () => {
    expect(daylightColor(25 * 60, 'dark')).toBe(daylightColor(60, 'dark'))
    expect(daylightColor(-60, 'dark')).toBe(daylightColor(23 * 60, 'dark'))
  })

  it('keeps the night anchors dim on dark', () => {
    const night = channels(daylightColor(3 * 60, 'dark'))
    // Nobody should get a bright wash in the dark; every channel stays low.
    night.forEach((v) => expect(v).toBeLessThan(64))
  })
})

describe('daylightGradient', () => {
  it('keeps the radial shape the token layer ships', () => {
    expect(daylightGradient(7 * 60, 'dark')).toContain('radial-gradient(120% 80% at 50% 0%')
    expect(daylightGradient(7 * 60, 'dark')).toContain('rgb(var(--color-bg))')
  })
})

describe('minutesOfDay', () => {
  it('reads local wall-clock minutes', () => {
    const noon = new Date(2026, 0, 1, 12, 30)
    expect(minutesOfDay(noon)).toBe(750)
  })
})
