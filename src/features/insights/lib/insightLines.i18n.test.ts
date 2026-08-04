import { describe, expect, it } from 'vitest'
import { buildInsightsLines } from './insightLines'
import { translate } from '@/i18n'
import type {
  FocusInsights,
  Insights,
  ReadingInsights,
  ReflectInsights,
  WorkoutInsights,
} from '../types'

const ru = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
  translate('ru', key, vars)

interface Modules {
  habits: Insights | null
  workouts: WorkoutInsights | null
  reading: ReadingInsights | null
  reflect: ReflectInsights | null
  focus: FocusInsights | null
}

const NONE: Modules = {
  habits: null,
  workouts: null,
  reading: null,
  reflect: null,
  focus: null,
}

function lineFor(over: Partial<Modules>): string {
  const [line] = buildInsightsLines({ ...NONE, ...over }, ru, 'ru-RU')
  return line?.text ?? ''
}

describe('cross-module insight lines in Russian', () => {
  it('declines the best-streak day count', () => {
    const streak = (bestStreak: number) =>
      lineFor({
        habits: { hasData: true, completionRate: 0, bestStreak, completionDelta: 0 } as Insights,
      })
    // The habits line comes first, so read the streak line off the full list.
    const list = (bestStreak: number) =>
      buildInsightsLines(
        {
          ...NONE,
          habits: { hasData: true, completionRate: 0, bestStreak, completionDelta: 0 } as Insights,
        },
        ru,
        'ru-RU',
      )
    expect(streak(3)).toContain('Привычки на 0%')
    expect(list(3)[1]?.text).toBe('Лучшая серия по привычкам: 3 дня.')
    expect(list(11)[1]?.text).toBe('Лучшая серия по привычкам: 11 дней.')
    expect(list(21)[1]?.text).toBe('Лучшая серия по привычкам: 21 день.')
  })

  it('declines training sessions', () => {
    const line = (completed30d: number) =>
      lineFor({ workouts: { hasData: true, completed30d } as WorkoutInsights })
    expect(line(1)).toBe('За месяц записана 1 тренировка.')
    expect(line(3)).toBe('За месяц записано 3 тренировки.')
    expect(line(11)).toBe('За месяц записано 11 тренировок.')
  })

  it('groups digits after choosing the plural form', () => {
    const line = lineFor({
      reading: { hasData: true, pages30d: 1234, booksReading: 0 } as ReadingInsights,
    })
    // 1234 ends in 4 and is not in the 11–14 band, so Russian takes "few" —
    // and the digits are grouped only after the form has been picked.
    expect(line).toMatch(/^За 30 дней прочитано 1\s?234 страницы\.$/)
  })

  it('declines the journaling streak', () => {
    const line = (currentStreak: number) =>
      lineFor({
        reflect: { hasData: true, currentStreak, daysJournaled30d: 0 } as ReflectInsights,
      })
    expect(line(2)).toBe('Серия дневника: 2 дня.')
    expect(line(5)).toBe('Серия дневника: 5 дней.')
  })
})
