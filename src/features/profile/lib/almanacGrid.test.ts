import { describe, expect, it } from 'vitest'
import {
  almanacStartKey,
  buildAlmanacGrid,
  countActiveDays,
  levelOf,
  weekStartKey,
} from '@/features/profile/lib/almanacGrid'
import { avatarColorKey, monogram } from '@/features/profile/lib/avatarColors'

describe('weekStartKey', () => {
  it('snaps to Monday, including from a Sunday', () => {
    expect(weekStartKey('2026-09-24')).toBe('2026-09-21') // Thursday
    expect(weekStartKey('2026-09-27')).toBe('2026-09-21') // Sunday
    expect(weekStartKey('2026-09-21')).toBe('2026-09-21') // Monday
  })
})

describe('buildAlmanacGrid', () => {
  it('ends on the current week and starts 25 Mondays earlier', () => {
    const grid = buildAlmanacGrid([], '2026-09-24')
    expect(grid).toHaveLength(26)
    expect(grid[0]![0]!.date).toBe(almanacStartKey('2026-09-24'))
    expect(grid[25]![0]!.date).toBe('2026-09-21')
    expect(grid[25]![6]!.date).toBe('2026-09-27')
  })

  it('marks today and the days after it', () => {
    const last = buildAlmanacGrid([], '2026-09-24')[25]!
    expect(last[3]).toMatchObject({ date: '2026-09-24', today: true, future: false })
    expect(last[4]).toMatchObject({ future: true, today: false })
    expect(last[2]).toMatchObject({ future: false, today: false })
  })

  it('tints a day by the share of its schedule kept', () => {
    const grid = buildAlmanacGrid(
      [
        { date: '2026-09-21', done: 1, due: 4 },
        { date: '2026-09-22', done: 2, due: 3 },
        { date: '2026-09-23', done: 3, due: 3 },
      ],
      '2026-09-24',
    )
    expect(grid[25]!.slice(0, 4).map((c) => c.level)).toEqual([1, 2, 3, 0])
  })
})

describe('levelOf', () => {
  it('lights any check-off, even on a day that asked for nothing', () => {
    expect(levelOf(0, 3)).toBe(0)
    expect(levelOf(1, 0)).toBe(3)
  })
})

describe('countActiveDays', () => {
  const scores = [
    { date: '2026-09-20', done: 1, due: 1 },
    { date: '2026-09-21', done: 0, due: 1 },
    { date: '2026-09-22', done: 2, due: 2 },
    { date: '2026-09-23', done: 0, due: 0 },
    { date: '2026-09-24', done: 1, due: 2 },
  ]

  it('counts from joining, today included', () => {
    expect(countActiveDays(scores, '2026-09-21', '2026-09-24')).toEqual({ active: 2, total: 4 })
  })

  it('clips to the window when the account is older than it', () => {
    expect(countActiveDays(scores, '2025-01-01', '2026-09-24')).toEqual({ active: 3, total: 5 })
  })

  it('is empty without scores', () => {
    expect(countActiveDays([], null, '2026-09-24')).toEqual({ active: 0, total: 0 })
  })
})

describe('avatar colours', () => {
  it('falls back to ember for anything unknown', () => {
    expect(avatarColorKey('teal')).toBe('teal')
    expect(avatarColorKey(null)).toBe('ember')
    expect(avatarColorKey('#fff')).toBe('ember')
  })

  it('draws one capital letter', () => {
    expect(monogram('  алекс ')).toBe('А')
    expect(monogram('')).toBe('?')
  })
})
