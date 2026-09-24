import { describe, expect, it } from 'vitest'
import { localHour } from '@/features/dashboard/lib/localHour'

describe('localHour', () => {
  const instant = new Date('2026-09-24T17:30:00Z')

  it('reads the hour in the given zone, not the machine’s', () => {
    expect(localHour('UTC', instant)).toBe(17)
    expect(localHour('Europe/Moscow', instant)).toBe(20)
    expect(localHour('America/New_York', instant)).toBe(13)
  })

  it('says 0 at midnight, not 24', () => {
    expect(localHour('UTC', new Date('2026-09-24T00:10:00Z'))).toBe(0)
  })
})
