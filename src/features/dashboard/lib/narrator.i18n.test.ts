import { describe, expect, it } from 'vitest'
import { buildNarratorLines } from './narrator'
import { translate } from '@/i18n'
import type { HabitWithTodayLog } from '@/features/habits/types'

const t =
  (locale: 'en' | 'ru') =>
  (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(locale, key, vars)

function habit(over: Partial<HabitWithTodayLog>): HabitWithTodayLog {
  return {
    id: 'h1',
    name: 'Чтение',
    streak: 0,
    rate: 0.5,
    dueToday: true,
    isComplete: false,
    atRisk: false,
    todayCount: 0,
    ...over,
  } as HabitWithTodayLog
}

describe('narrator in Russian', () => {
  it('declines the at-risk streak by day count', () => {
    const line = (streak: number) =>
      buildNarratorLines([habit({ streak, atRisk: true })], t('ru')).find((l) =>
        l.id.startsWith('risk-'),
      )?.text
    expect(line(1)).toContain('Серия в 1 день')
    expect(line(3)).toContain('Серия в 3 дня')
    expect(line(11)).toContain('Серия в 11 дней')
    expect(line(21)).toContain('Серия в 21 день')
  })

  it('keeps the habit name verbatim inside a translated sentence', () => {
    const [line] = buildNarratorLines([habit({ streak: 5, atRisk: true })], t('ru'))
    expect(line?.text).toContain('«Чтение»')
  })

  it('still reads in English on the default locale', () => {
    const [line] = buildNarratorLines([], t('en'))
    expect(line?.text).toBe('No habits tracked yet — add the first to begin.')
  })
})
