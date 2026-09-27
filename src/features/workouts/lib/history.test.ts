import { describe, expect, it } from 'vitest'
import type { SessionHistoryRow } from '@/features/workouts/api/history.api'
import { historyEntries, mainLift } from './history'

function row(date: string, sets: SessionHistoryRow['sets'], minutes = 40): SessionHistoryRow {
  const start = Date.parse(`${date}T10:00:00Z`)
  return {
    id: date,
    date,
    started_at: new Date(start).toISOString(),
    completed_at: new Date(start + minutes * 60_000).toISOString(),
    workout_id: 'w',
    workout_name: 'Ноги',
    sets,
  }
}

const squat = (weight: number, done = true, reps = 5) => ({
  reps,
  weight,
  done,
  exercise_id: 'sq',
  exercise_name: 'Присед',
})
const curl = (weight: number) => ({
  reps: 10,
  weight,
  done: true,
  exercise_id: 'cu',
  exercise_name: 'Бицепс',
})

describe('historyEntries', () => {
  it('counts only done sets toward sets and volume', () => {
    const [entry] = historyEntries([row('2026-09-20', [squat(100), squat(100, false)], 42)])
    expect(entry).toMatchObject({ minutes: 42, sets: 1, volume: 500, name: 'Ноги' })
  })
})

describe('mainLift', () => {
  it('follows the exercise done in the most sessions, oldest first', () => {
    const lift = mainLift([
      row('2026-09-20', [squat(105), squat(100)]),
      row('2026-09-13', [squat(100), curl(20)]),
      row('2026-09-06', [curl(18)]),
      row('2026-09-01', [squat(95)]),
    ])
    expect(lift).toEqual({ name: 'Присед', points: [95, 100, 105], delta: 10 })
  })

  it('needs two sessions to draw a trend', () => {
    expect(mainLift([row('2026-09-20', [squat(100)])])).toBeNull()
    expect(mainLift([])).toBeNull()
  })

  it('ignores sets that were not done or carry no weight', () => {
    expect(
      mainLift([row('2026-09-20', [squat(100, false)]), row('2026-09-13', [squat(0)])]),
    ).toBeNull()
  })
})
