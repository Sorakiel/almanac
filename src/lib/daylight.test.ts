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
    // Dawn and dusk are the desktop prototype's glow over each canvas.
    expect(channels(daylightColor(6 * 60, 'dark'))).toEqual([61, 41, 33])
    expect(channels(daylightColor(13 * 60, 'dark'))).toEqual([53, 38, 32])
    expect(channels(daylightColor(13 * 60, 'coffee'))).toEqual([243, 223, 200])
    expect(channels(daylightColor(3 * 60, 'dark'))).toEqual([28, 34, 58])
  })

  it('holds dawn and dusk for hours, not a moment', () => {
    for (const h of [6, 7, 8, 9, 17, 18, 19, 20, 21]) {
      expect(channels(daylightColor(h * 60, 'dark')), `${h}:00`).toEqual([61, 41, 33])
      expect(channels(daylightColor(h * 60, 'coffee')), `${h}:00`).toEqual([244, 217, 190])
    }
  })

  it('interpolates between anchors', () => {
    const [r] = channels(daylightColor(11 * 60, 'dark'))
    // Halfway from the morning plateau (61) to midday (53).
    expect(r).toBeGreaterThan(53)
    expect(r).toBeLessThan(61)
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

  it('keeps the night cool and dim on dark, yet distinct from the canvas', () => {
    const [r, g, b] = channels(daylightColor(3 * 60, 'dark'))
    // Nobody should get a bright wash in the dark; every channel stays low…
    ;[r, g, b].forEach((v) => expect(v!).toBeLessThan(64))
    // …but it reads as blue, not as the #111113 canvas.
    expect(b! - r!).toBeGreaterThanOrEqual(20)
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
