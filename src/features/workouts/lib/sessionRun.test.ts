import { describe, expect, it } from 'vitest'
import type { SessionHistoryRow } from '@/features/workouts/api/history.api'
import type { SessionExercise, SetLog } from '@/features/workouts/types'
import {
  adjust,
  currentCursor,
  formatTimer,
  isRecord,
  lastTime,
  nextUp,
  sessionRecord,
  sessionTotals,
  valuesOf,
} from './sessionRun'

function set(id: string, n: number, weight: number, reps: number, done = false): SetLog {
  return {
    id,
    workout_exercise_id: 'we',
    set_number: n,
    reps,
    weight,
    done,
    logged_at: null,
    rest_seconds: null,
    session_id: null,
  } as SetLog
}

function exercise(id: string, name: string, sets: SetLog[]): SessionExercise {
  return {
    id,
    exerciseId: `x-${id}`,
    name,
    muscleGroup: null,
    targetSets: sets.length,
    targetReps: sets[0]?.reps ?? null,
    targetWeight: sets[0]?.weight ?? null,
    sortOrder: 0,
    sets,
  }
}

const squat = () =>
  exercise('sq', 'Присед', [set('s1', 1, 90, 5, true), set('s2', 2, 90, 5), set('s3', 3, 90, 5)])
const rdl = () => exercise('rd', 'Румынская тяга', [set('r1', 1, 70, 10), set('r2', 2, 70, 10)])

describe('currentCursor', () => {
  it('is the first undone set in plan order', () => {
    expect(currentCursor([squat(), rdl()], null)).toEqual({ exercise: 0, set: 1 })
  })
  it('follows a picked exercise while it has sets left', () => {
    expect(currentCursor([squat(), rdl()], 1)).toEqual({ exercise: 1, set: 0 })
  })
  it('is null once everything is done', () => {
    const done = exercise('d', 'D', [set('d1', 1, 10, 10, true)])
    expect(currentCursor([done], null)).toBeNull()
  })
})

describe('adjust', () => {
  it('steps this set and the undone ones after it, not the done ones', () => {
    const ex = squat()
    const o = adjust(ex, 1, 'weight', 2.5, {})
    expect(o).toEqual({ s2: { weight: 92.5, reps: 5 }, s3: { weight: 92.5, reps: 5 } })
    expect(valuesOf(ex.sets[0] as SetLog, o)).toEqual({ weight: 90, reps: 5 })
  })
  it('never takes reps below one', () => {
    const o = adjust(squat(), 1, 'reps', -10, {})
    expect(o.s2?.reps).toBe(1)
  })
})

describe('nextUp', () => {
  it('names the next set of the same exercise', () => {
    expect(nextUp([squat(), rdl()], { exercise: 0, set: 1 }, {})).toEqual({
      kind: 'set',
      name: 'Присед',
      setNumber: 3,
    })
  })
  it('moves to another exercise with its numbers once this one is through', () => {
    expect(nextUp([squat(), rdl()], { exercise: 0, set: 2 }, {})).toEqual({
      kind: 'exercise',
      name: 'Румынская тяга',
      values: { weight: 70, reps: 10 },
    })
  })
})

function row(date: string, sets: SessionHistoryRow['sets']): SessionHistoryRow {
  return {
    id: date,
    date,
    started_at: `${date}T10:00:00Z`,
    completed_at: `${date}T10:40:00Z`,
    workout_id: 'w',
    workout_name: 'Ноги',
    sets,
  }
}
const logged = (weight: number, reps: number, exercise_id = 'x-sq') => ({
  reps,
  weight,
  done: true,
  exercise_id,
  exercise_name: 'Присед',
})

describe('lastTime', () => {
  const rows = [
    row('2026-09-16', [logged(87.5, 5), logged(85, 8)]),
    row('2026-09-10', [logged(95, 3)]),
    row('2026-09-27', [logged(100, 5)]),
  ]
  it('takes the heaviest set of the latest earlier session', () => {
    expect(lastTime(rows, 'x-sq', '2026-09-27')).toEqual({ weight: 87.5, reps: 5 })
  })
  it('is null when the exercise was never done before', () => {
    expect(lastTime(rows, 'x-other', '2026-09-27')).toBeNull()
  })
})

describe('records', () => {
  it('counts heavier, or as heavy for more reps', () => {
    expect(isRecord({ weight: 90, reps: 5 }, { weight: 87.5, reps: 5 })).toBe(true)
    expect(isRecord({ weight: 87.5, reps: 6 }, { weight: 87.5, reps: 5 })).toBe(true)
    expect(isRecord({ weight: 87.5, reps: 5 }, { weight: 87.5, reps: 5 })).toBe(false)
    expect(isRecord({ weight: 90, reps: 5 }, null)).toBe(false)
  })
  it('finds the session record and its margin', () => {
    const rec = sessionRecord([squat(), rdl()], {}, (e) =>
      e.id === 'sq' ? { weight: 87.5, reps: 5 } : null,
    )
    expect(rec).toEqual({ name: 'Присед', values: { weight: 90, reps: 5 }, delta: 2.5 })
  })
})

describe('sessionTotals', () => {
  it('sums the done sets with their dialled-in numbers', () => {
    expect(sessionTotals([squat()], { s1: { weight: 100, reps: 5 } })).toEqual({
      sets: 1,
      volume: 500,
    })
  })
})

describe('formatTimer', () => {
  it('pads minutes and seconds', () => {
    expect(formatTimer(7_400)).toBe('00:07')
    expect(formatTimer(89_700)).toBe('01:29')
    expect(formatTimer(3_725_000)).toBe('1:02:05')
  })
})
