import { describe, it, expect } from 'vitest'
import { weekdayLabels } from '@/features/settings/lib/digest'

describe('weekdayLabels', () => {
  it('returns 7 labels starting from Sunday', () => {
    const labels = weekdayLabels('en')
    expect(labels).toHaveLength(7)
    expect(labels[0]).toMatch(/sun/i)
    expect(labels[6]).toMatch(/sat/i)
  })

  it('localizes into Russian', () => {
    const labels = weekdayLabels('ru')
    expect(labels).toHaveLength(7)
    expect(labels.every((l) => l.length > 0)).toBe(true)
    // Russian week starts Monday in common usage, but the array itself stays
    // Sunday-first (index 0) to match digest_day's 0=Sunday convention.
    expect(labels[0]).not.toEqual(labels[1])
  })
})
