import { describe, expect, it } from 'vitest'
import { clampFocusMinutes } from '@/features/flow/lib/duration'

describe('clampFocusMinutes', () => {
  it('keeps a value inside the range, rounded', () => {
    expect(clampFocusMinutes(50, 25)).toBe(50)
    expect(clampFocusMinutes(37.6, 25)).toBe(38)
  })

  it('clamps to 5–180', () => {
    expect(clampFocusMinutes(1, 25)).toBe(5)
    expect(clampFocusMinutes(600, 25)).toBe(180)
  })

  it('falls back on garbage', () => {
    expect(clampFocusMinutes(Number.NaN, 25)).toBe(25)
  })
})
