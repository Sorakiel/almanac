import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSessionClock } from '@/features/workouts/hooks/useSessionClock'
import { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { useWorkoutHistory } from '@/features/workouts/hooks/useWorkoutHistory'
import {
  adjust,
  currentCursor,
  formatKg,
  isRecord,
  lastTime,
  nextUp,
  sessionRecord,
  sessionTotals,
  valuesOf,
  type NextUp,
  type Overrides,
  type SetValues,
} from '@/features/workouts/lib/sessionRun'
import { DEFAULT_REST_SECONDS } from '@/features/workouts/lib/session'
import { useWorkoutSessionStore } from '@/features/workouts/stores/workoutSession'
import type { SessionExercise } from '@/features/workouts/types'
import { haptic } from '@/lib/platform/haptics'
import { intlLocale } from '@/lib/dateLocale'
import { toastWithUndo } from '@/lib/undoToast'
import { toUserError } from '@/lib/userError'
import { useT, type TFunction } from '@/hooks/useT'

/** The beat the "Set done" button stays green before the rest starts (prototype: 0.28 s). */
const DONE_BEAT_MS = 280

function nextLabel(next: NextUp | null, t: TFunction, locale: string): string | null {
  if (!next) return null
  return next.kind === 'set'
    ? t('workouts.session.nextSet', { name: next.name, n: next.setNumber })
    : t('workouts.session.nextExercise', {
        name: next.name,
        weight: formatKg(next.values.weight, locale),
        reps: next.values.reps,
      })
}

/**
 * Everything the live session does, one set at a time (`MOD.session`): which
 * set is up, the steppers' numbers, ticking it (a green beat, then rest),
 * rest ±15 s, the track's exercise pick, undo, and closing the workout.
 */
export function useSessionRunner(id: string) {
  const { t, locale } = useT()
  const loc = intlLocale(locale)
  const navigate = useNavigate()
  const { workout, exercises, sessionDate, isLoading, isError } = useWorkoutDetail(id)
  const { rows } = useWorkoutHistory()
  const record = useWorkoutSessionStore((s) => s.sessions[id])
  const start = useWorkoutSessionStore((s) => s.start)
  const pause = useWorkoutSessionStore((s) => s.pause)
  const end = useWorkoutSessionStore((s) => s.end)
  const clock = useSessionClock(record)
  // Ticking the last set closes the workout: the clock stops on the finish.
  const mutations = useSessionMutations(id, { onFinished: () => pause(id) })

  const [preferred, setPreferred] = useState<number | null>(null)
  const [overrides, setOverrides] = useState<Overrides>({})
  const [justDone, setJustDone] = useState(false)
  const [showSets, setShowSets] = useState(false)
  const doneOrder = useRef<string[]>([])

  // A deep link or reload starts the clock once; the store keeps its place.
  useEffect(() => {
    if (id && !useWorkoutSessionStore.getState().sessions[id]) start(id)
  }, [id, start])

  // The rest ran out on its own: a buzz, and the stage goes back to work.
  const restEndsAt = clock.restEndsAt
  const resting = clock.restMs !== null
  useEffect(() => {
    if (restEndsAt !== null && !resting) haptic('medium')
  }, [restEndsAt, resting])

  const cursor = currentCursor(exercises, preferred)
  const exercise = cursor ? exercises[cursor.exercise] : undefined
  const set = cursor && exercise ? exercise.sets[cursor.set] : undefined
  const values: SetValues | null = set ? valuesOf(set, overrides) : null

  // "Last time" per exercise, from the latest earlier finished session.
  const lastByExercise = useMemo(
    () =>
      new Map(exercises.map((ex) => [ex.exerciseId, lastTime(rows, ex.exerciseId, sessionDate)])),
    [exercises, rows, sessionDate],
  )
  const lastOf = (ex: SessionExercise): SetValues | null =>
    lastByExercise.get(ex.exerciseId) ?? null
  const last = exercise ? lastOf(exercise) : null

  const onAdjust = (field: keyof SetValues, delta: number) => {
    if (!cursor || !exercise) return
    haptic('light')
    setOverrides((o) => adjust(exercise, cursor.set, field, delta, o))
  }

  const onDone = () => {
    if (!cursor || !set || !values || justDone) return
    const next = nextUp(exercises, cursor, overrides)
    haptic('success')
    setJustDone(true)
    window.setTimeout(() => {
      setJustDone(false)
      doneOrder.current.push(set.id)
      mutations.editSet.mutate(
        { set: { ...set, weight: values.weight, reps: values.reps }, done: true },
        { onError: (e) => toast.error(toUserError(e, t, 'workouts.session.logFailed')) },
      )
      if (preferred === cursor.exercise && next?.kind !== 'set') setPreferred(null)
      if (next) clock.startRest(set.rest_seconds ?? DEFAULT_REST_SECONDS)
    }, DONE_BEAT_MS)
  }

  const onUndoLast = () => {
    const all = exercises.flatMap((e) => e.sets)
    const lastId = doneOrder.current.pop()
    const target =
      all.find((s) => s.id === lastId && s.done) ??
      [...all]
        .filter((s) => s.done)
        .sort((a, b) => (a.logged_at ?? '').localeCompare(b.logged_at ?? ''))
        .pop()
    if (!target) return
    clock.skipRest()
    start(id)
    mutations.editSet.mutate({ set: target, done: false })
    const owner = exercises.findIndex((e) => e.sets.some((s) => s.id === target.id))
    setPreferred(owner >= 0 ? owner : null)
  }

  const onPick = (index: number) => {
    const ex = exercises[index]
    if (!ex || ex.sets.every((s) => s.done)) return
    setPreferred(index)
  }

  // Save / finish early: the workout counts as done, a toast offers Undo.
  const close = () => {
    const done = exercises.flatMap((e) => e.sets).filter((s) => s.done).length
    mutations.setCompleted.mutate(true, {
      onError: (e) => toast.error(toUserError(e, t, 'workouts.session.finishFailed')),
    })
    const undo = mutations.setCompleted
    toastWithUndo(
      t('workouts.session.savedToast', { sets: t('workouts.setsCount', { count: done }) }),
      t('common.undo'),
      () => undo.mutate(false),
    )
    end(id)
    navigate('/train')
  }

  const totals = sessionTotals(exercises, overrides)
  return {
    workout,
    exercises,
    isLoading,
    isError,
    clock,
    cursor,
    exercise,
    set,
    values,
    last,
    record: values ? isRecord(values, last) : false,
    next: cursor ? nextLabel(nextUp(exercises, cursor, overrides), t, loc) : null,
    finished: exercises.length > 0 && cursor === null,
    totals,
    sessionRecord: sessionRecord(exercises, overrides, lastOf),
    overrides,
    justDone,
    showSets,
    toggleSets: () => setShowSets((v) => !v),
    onAdjust,
    onDone,
    onUndoLast,
    onPick,
    onSave: close,
    onFinishEarly: close,
  }
}
