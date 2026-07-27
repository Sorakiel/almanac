import { describe, expect, it } from 'vitest'
import {
  completedVolume,
  currentExerciseIndex,
  currentSet,
  estimateMinutes,
  formatClock,
  isExerciseDone,
  plannedVolume,
  sessionProgress,
} from '@/features/workouts/lib/session'
import type { SessionExercise, SetLog } from '@/features/workouts/types'

let setId = 0
function makeSet(overrides: Partial<SetLog> = {}): SetLog {
  setId += 1
  return {
    id: `s${setId}`,
    workout_exercise_id: 'we1',
    set_number: 1,
    reps: 10,
    weight: 50,
    done: false,
    logged_at: '2026-07-01T00:00:00Z',
    rest_seconds: null,
    ...overrides,
  }
}

function makeExercise(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'we1',
    exerciseId: 'e1',
    name: 'Bench Press',
    muscleGroup: 'chest',
    targetSets: null,
    targetReps: null,
    targetWeight: null,
    sortOrder: 0,
    sets: [],
    ...overrides,
  }
}

describe('sessionProgress', () => {
  it('is 0% with no sets', () => {
    expect(sessionProgress([])).toEqual({ doneSets: 0, totalSets: 0, pct: 0 })
  })

  it('counts done sets across exercises', () => {
    const exercises = [
      makeExercise({ sets: [makeSet({ done: true }), makeSet({ done: false })] }),
      makeExercise({ id: 'we2', sets: [makeSet({ done: true })] }),
    ]
    expect(sessionProgress(exercises)).toEqual({ doneSets: 2, totalSets: 3, pct: 67 })
  })
})

describe('volume', () => {
  it('completedVolume sums reps × weight over done sets only', () => {
    const ex = makeExercise({
      sets: [makeSet({ reps: 8, weight: 60, done: true }), makeSet({ reps: 8, weight: 60 })],
    })
    expect(completedVolume([ex])).toBe(480)
  })

  it('plannedVolume uses targets when present', () => {
    const ex = makeExercise({ targetSets: 4, targetReps: 8, targetWeight: 60 })
    expect(plannedVolume([ex])).toBe(1920)
  })

  it('plannedVolume falls back to logged set count', () => {
    const ex = makeExercise({
      targetReps: 8,
      targetWeight: 60,
      sets: [makeSet(), makeSet()],
    })
    expect(plannedVolume([ex])).toBe(960)
  })
})

describe('estimateMinutes', () => {
  it('scales with planned sets', () => {
    const ex = makeExercise({ targetSets: 4 })
    expect(estimateMinutes([ex])).toBe(10)
  })
})

describe('current exercise / set', () => {
  it('isExerciseDone requires at least one set, all done', () => {
    expect(isExerciseDone(makeExercise({ sets: [] }))).toBe(false)
    expect(isExerciseDone(makeExercise({ sets: [makeSet({ done: true })] }))).toBe(true)
    expect(isExerciseDone(makeExercise({ sets: [makeSet({ done: false })] }))).toBe(false)
  })

  it('currentExerciseIndex points to the first unfinished exercise', () => {
    const exercises = [
      makeExercise({ id: 'a', sets: [makeSet({ done: true })] }),
      makeExercise({ id: 'b', sets: [makeSet({ done: false })] }),
      makeExercise({ id: 'c', sets: [makeSet({ done: false })] }),
    ]
    expect(currentExerciseIndex(exercises)).toBe(1)
  })

  it('currentExerciseIndex returns the last index when all done', () => {
    const exercises = [
      makeExercise({ id: 'a', sets: [makeSet({ done: true })] }),
      makeExercise({ id: 'b', sets: [makeSet({ done: true })] }),
    ]
    expect(currentExerciseIndex(exercises)).toBe(1)
  })

  it('currentExerciseIndex is -1 when empty', () => {
    expect(currentExerciseIndex([])).toBe(-1)
  })

  it('currentSet returns the first not-done set', () => {
    const ex = makeExercise({
      sets: [makeSet({ set_number: 1, done: true }), makeSet({ set_number: 2, done: false })],
    })
    expect(currentSet(ex)?.set_number).toBe(2)
    expect(currentSet(makeExercise({ sets: [makeSet({ done: true })] }))).toBeNull()
  })
})

describe('formatClock', () => {
  it('formats under an hour as M:SS', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9_000)).toBe('0:09')
    expect(formatClock(90_000)).toBe('1:30')
  })

  it('formats an hour or more as H:MM:SS', () => {
    expect(formatClock(3_661_000)).toBe('1:01:01')
  })

  it('clamps negatives to zero', () => {
    expect(formatClock(-500)).toBe('0:00')
  })
})
