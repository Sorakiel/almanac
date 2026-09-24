import { describe, expect, it } from 'vitest'
import { changed, fromRow, isEmpty, toPatch } from '@/features/settings/lib/userSettings'

const row = (over: Partial<Parameters<typeof fromRow>[0]> = {}) => ({
  modules: null,
  theme: null,
  locale: null,
  sound: null,
  updated_at: '2026-09-24T10:00:00Z',
  ...over,
})

describe('fromRow', () => {
  it('reads every known value', () => {
    expect(
      fromRow(row({ theme: 'system', locale: 'ru', sound: true, modules: { reading: true } })),
    ).toEqual({ theme: 'system', locale: 'ru', sound: true, modules: { reading: true } })
  })

  it('leaves null columns to the device', () => {
    expect(fromRow(row())).toEqual({})
  })

  it('drops what a newer build may have written and this one cannot show', () => {
    expect(
      fromRow(row({ theme: 'neon', locale: 'de', modules: { reading: true, finances: true } })),
    ).toEqual({ modules: { reading: true } })
    expect(fromRow(row({ modules: { reading: 'yes' } }))).toEqual({ modules: {} })
    expect(fromRow(row({ modules: ['reading'] }))).toEqual({})
  })
})

describe('changed', () => {
  const base = {
    theme: 'dark' as const,
    locale: 'en' as const,
    sound: false,
    modules: { reading: false, flow: true },
  }

  it('is empty when nothing moved — including a re-created modules object', () => {
    expect(isEmpty(changed(base, { ...base, modules: { flow: true, reading: false } }))).toBe(true)
  })

  it('carries only the fields that moved', () => {
    expect(changed(base, { ...base, theme: 'coffee' })).toEqual({ theme: 'coffee' })
    expect(changed(base, { ...base, modules: { reading: true, flow: true } })).toEqual({
      modules: { reading: true, flow: true },
    })
  })
})

describe('toPatch', () => {
  it('writes only the columns present, so it never clears another device’s choice', () => {
    expect(toPatch({ theme: 'coffee' })).toEqual({ theme: 'coffee' })
    expect(toPatch({})).toEqual({})
  })
})
