import { describe, expect, it } from 'vitest'
import {
  buildDraft,
  draftSignature,
  draftSummary,
  estimateMinutes,
  exerciseSubtitle,
  isTempId,
  muscleSummary,
  restLabel,
  setsChip,
  volumeLabel,
  type WorkoutDraft,
} from '@/features/workouts/lib/draft'
import type { SessionExercise, SetLog } from '@/features/workouts/types'

let setId = 0
function makeSet(overrides: Partial<SetLog> = {}): SetLog {
  setId += 1
  return {
    id: `s${setId}`,
    workout_exercise_id: 'we1',
    set_number: 1,
    reps: 10,
    weight: 20,
    done: false,
    logged_at: null,
    rest_seconds: 90,
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

describe('buildDraft', () => {
  it('maps exercises + sets, carrying rest across', () => {
    const draft = buildDraft('Upper A', [
      makeExercise({ sets: [makeSet({ reps: 8, weight: 60, rest_seconds: 120 })] }),
    ])
    expect(draft.name).toBe('Upper A')
    expect(draft.exercises[0]?.sets[0]).toEqual({
      id: expect.any(String),
      reps: 8,
      weight: 60,
      restSeconds: 120,
    })
  })
})

describe('draftSignature', () => {
  it('ignores ids but reflects value changes', () => {
    const base = buildDraft('A', [makeExercise({ sets: [makeSet({ reps: 8 })] })])
    const same: WorkoutDraft = JSON.parse(JSON.stringify(base))
    same.exercises[0]!.id = 'different-id'
    same.exercises[0]!.sets[0]!.id = 'tmp-9'
    expect(draftSignature(same)).toBe(draftSignature(base))

    const changed: WorkoutDraft = JSON.parse(JSON.stringify(base))
    changed.exercises[0]!.sets[0]!.reps = 12
    expect(draftSignature(changed)).not.toBe(draftSignature(base))
  })
})

describe('summaries', () => {
  const draft = buildDraft('A', [
    makeExercise({
      muscleGroup: 'chest',
      sets: [makeSet({ reps: 8, weight: 60 }), makeSet({ reps: 8, weight: 60 })],
    }),
    makeExercise({
      id: 'we2',
      muscleGroup: 'shoulders',
      sets: [makeSet({ reps: 10, weight: 20 })],
    }),
  ])

  it('draftSummary counts exercises, sets, and volume', () => {
    expect(draftSummary(draft)).toEqual({ exercises: 2, sets: 3, volume: 8 * 60 * 2 + 10 * 20 })
  })

  it('setsChip and subtitle use the first set', () => {
    expect(setsChip(draft.exercises[0]!)).toBe('2 × 8')
    expect(exerciseSubtitle(draft.exercises[0]!)).toBe('chest · 2 sets · 8 reps · 60 kg')
  })

  it('muscleSummary is unique + uppercased', () => {
    expect(muscleSummary(draft)).toBe('CHEST · SHOULDERS')
  })

  it('estimateMinutes scales with set count', () => {
    expect(estimateMinutes(draft)).toBe(Math.round(3 * 2.5))
  })
})

describe('labels', () => {
  it('volumeLabel switches to tonnes past 1000kg', () => {
    expect(volumeLabel(820)).toBe('820 kg')
    expect(volumeLabel(8200)).toBe('8.2t')
  })

  it('restLabel shows seconds or a dash', () => {
    expect(restLabel(90)).toBe('90s')
    expect(restLabel(0)).toBe('—')
    expect(restLabel(null)).toBe('—')
  })

  it('isTempId only matches placeholders', () => {
    expect(isTempId('tmp-3')).toBe(true)
    expect(isTempId('real-uuid')).toBe(false)
  })
})
