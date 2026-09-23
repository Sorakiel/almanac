import { describe, expect, it } from 'vitest'
import { muscleLabel } from '@/features/workouts/lib/muscles'
import { translate } from '@/i18n'
import type { TFunction } from '@/hooks/useT'

const ru: TFunction = (key, vars) => translate('ru', key, vars)

describe('muscleLabel', () => {
  it('translates the common English groups whatever their case', () => {
    expect(muscleLabel('legs', ru)).toBe('ноги')
    expect(muscleLabel(' Full Body ', ru)).toBe('всё тело')
  })

  it('leaves a group the user typed themselves alone', () => {
    expect(muscleLabel('Спина', ru)).toBe('Спина')
    expect(muscleLabel('rotator cuff', ru)).toBe('rotator cuff')
  })
})
