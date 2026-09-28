import { describe, expect, it } from 'vitest'
import { cadenceOf } from '@/features/habits/lib/cadence'

describe('cadenceOf', () => {
  it('reads the quick chips back from a saved cadence', () => {
    expect(cadenceOf('daily', 1)).toBe('daily')
    expect(cadenceOf('x_per_week', 3)).toBe('three_a_week')
    expect(cadenceOf('weekly', 1)).toBe('weekly')
  })

  it('treats every other cadence as custom', () => {
    expect(cadenceOf('x_per_week', 4)).toBe('custom')
    expect(cadenceOf('every_n_days', 2)).toBe('custom')
  })
})
