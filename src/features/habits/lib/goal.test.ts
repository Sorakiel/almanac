import { describe, expect, it } from 'vitest'
import { translate } from '@/i18n'
import type { TFunction } from '@/hooks/useT'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { goalMode, goalProgress, normalizeUnit, unitLabel } from '@/features/habits/lib/goal'

const ru: TFunction = (key, vars) => translate('ru', key, vars)
const en: TFunction = (key, vars) => translate('en', key, vars)

describe('goalMode', () => {
  it('reads a plain check-off as once', () => {
    expect(goalMode({ goal: 1, unit: null })).toBe('once')
  })

  it('recognises a preset only when amount and unit both match', () => {
    expect(goalMode({ goal: 8, unit: 'glasses' })).toBe('glasses')
    expect(goalMode({ goal: 9, unit: 'glasses' })).toBe('custom')
    expect(goalMode({ goal: 8, unit: 'кружек' })).toBe('custom')
  })
})

describe('unitLabel', () => {
  it('pluralises known units in Russian, 11–14 included', () => {
    expect(unitLabel('glasses', 1, ru)).toBe('стакан')
    expect(unitLabel('glasses', 3, ru)).toBe('стакана')
    expect(unitLabel('glasses', 8, ru)).toBe('стаканов')
    expect(unitLabel('glasses', 12, ru)).toBe('стаканов')
    expect(unitLabel('pages', 21, ru)).toBe('страница')
  })

  it('shows the user’s own word as typed', () => {
    expect(unitLabel('кружек', 3, ru)).toBe('кружек')
    expect(unitLabel(null, 3, ru)).toBe('')
  })
})

describe('goalProgress', () => {
  it('agrees the unit with the goal', () => {
    expect(goalProgress(3, { daily_goal: 8, unit: 'glasses' }, ru)).toBe('3 из 8 стаканов')
    expect(goalProgress(1, { daily_goal: 2, unit: 'glasses' }, en)).toBe('1 of 2 glasses')
    expect(goalProgress(1, { daily_goal: 5, unit: null }, en)).toBe('1 of 5')
  })
})

describe('normalizeUnit', () => {
  it('trims, caps and turns blank into null', () => {
    expect(normalizeUnit('  раз ')).toBe('раз')
    expect(normalizeUnit('   ')).toBeNull()
    expect(normalizeUnit('x'.repeat(40))).toHaveLength(16)
  })
})

describe('dailyTarget', () => {
  it('is the daily goal, whatever the cadence’s own number says', () => {
    expect(dailyTarget({ daily_goal: 1 })).toBe(1)
    expect(dailyTarget({ daily_goal: 8 })).toBe(8)
  })
})
