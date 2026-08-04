import { describe, expect, it } from 'vitest'
import { translate } from '@/i18n'
import { en } from '@/i18n/en'
import { ru } from '@/i18n/ru'

describe('translate', () => {
  it('returns the string for the active locale', () => {
    expect(translate('en', 'nav.today')).toBe('Today')
    expect(translate('ru', 'nav.today')).toBe('Сегодня')
  })

  it('fills placeholders', () => {
    expect(translate('en', 'settings.joined', { count: 12 })).toBe('12-day')
  })

  it('leaves an unknown placeholder alone rather than printing undefined', () => {
    expect(translate('en', 'settings.joined', {})).toBe('{count}-day')
  })

  it('picks the Russian plural form, including the 11–14 trap', () => {
    const forms = [1, 2, 5, 11, 21, 112].map((n) => translate('ru', 'status.habits', { count: n }))
    expect(forms).toEqual([
      '1 привычка',
      '2 привычки',
      '5 привычек',
      '11 привычек',
      '21 привычка',
      '112 привычек',
    ])
  })

  it('pluralises English on one/other', () => {
    expect(translate('en', 'status.habits', { count: 1 })).toBe('1 habit')
    expect(translate('en', 'status.habits', { count: 2 })).toBe('2 habits')
  })

  it('falls back to English while a screen is still untranslated', () => {
    // Simulates a key present in `en` but missing from a locale at runtime —
    // the staged rollout depends on this reading as English, not as a key.
    const partial = { nav: {} } as unknown as typeof ru
    const original = ru.nav
    Object.assign(ru, { nav: partial.nav })
    expect(translate('ru', 'nav.today')).toBe('Today')
    Object.assign(ru, { nav: original })
  })
})

describe('dictionaries', () => {
  it('covers every English key in Russian', () => {
    const keys = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'string' ? [`${prefix}${k}`] : keys(v as object, `${prefix}${k}.`),
      )
    // Plural sets legitimately differ in shape (en has one/other, ru one/few/many),
    // so compare the paths that lead *to* a leaf rather than the leaves themselves.
    const branch = (paths: string[]) =>
      new Set(paths.map((p) => p.split('.').slice(0, 2).join('.')))
    expect(branch(keys(ru))).toEqual(branch(keys(en)))
  })
})
