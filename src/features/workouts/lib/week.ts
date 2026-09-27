import { getISOWeek, parseISO } from 'date-fns'
import { addDaysToKey, weekdayOfKey } from '@/lib/date'
import { isDoneOn, isDueOn } from '@/features/workouts/lib/recurrence'
import type { WorkoutView } from '@/features/workouts/types'
import type { TFunction } from '@/hooks/useT'

export interface WeekDay {
  /** Local calendar date, `YYYY-MM-DD`. */
  dateKey: string
  /** Short weekday label, e.g. "MON". */
  weekday: string
  /** Day of month, 1–31. */
  dayOfMonth: number
  isToday: boolean
  /** Workouts scheduled on this day. */
  dueCount: number
  /** Of the due workouts, how many were completed on this day. */
  doneCount: number
}

export interface WeekView {
  /** ISO week number of the strip, e.g. 28. */
  weekNumber: number
  days: WeekDay[]
}

/** Dictionary keys for the strip, Monday-first. */
const WEEKDAY_STRIP_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/**
 * The Monday-anchored 7-day strip containing `todayKey`, each day carrying how
 * many workouts are due and how many were completed — the training week header.
 */
export function buildWeek(
  todayKey: string,
  workouts: WorkoutView[],
  timezone: string,
  t: TFunction,
): WeekView {
  // weekdayOfKey is 0=Sun … 6=Sat; step back to this week's Monday.
  const mondayOffset = (weekdayOfKey(todayKey) + 6) % 7
  const monday = addDaysToKey(todayKey, -mondayOffset)

  const days: WeekDay[] = WEEKDAY_STRIP_KEYS.map((weekday, i) => {
    const dateKey = addDaysToKey(monday, i)
    const due = workouts.filter((w) => isDueOn(w, dateKey))
    return {
      dateKey,
      weekday: t(`workouts.weekdayStrip.${weekday}`),
      dayOfMonth: Number(dateKey.slice(8, 10)),
      isToday: dateKey === todayKey,
      dueCount: due.length,
      doneCount: due.filter((w) => isDoneOn(w, dateKey, timezone)).length,
    }
  })

  return { weekNumber: getISOWeek(parseISO(`${monday}T00:00:00`)), days }
}

/** Where a day sits relative to today — gates the "start session" action. */
export function dayStateFor(dateKey: string, todayKey: string): 'today' | 'past' | 'future' {
  if (dateKey === todayKey) return 'today'
  return dateKey < todayKey ? 'past' : 'future'
}

/**
 * The session to surface for a given day: the one due that day, preferring one
 * not yet completed, with a per-day done flag. Null when nothing is scheduled.
 */
export function workoutForDay(
  workouts: WorkoutView[],
  dateKey: string,
  timezone: string,
): { workout: WorkoutView; done: boolean } | null {
  const due = workouts.filter((w) => isDueOn(w, dateKey))
  const workout = due.find((w) => !isDoneOn(w, dateKey, timezone)) ?? due[0]
  if (!workout) return null
  return { workout, done: isDoneOn(workout, dateKey, timezone) }
}

/** How far ahead the next occurrence is looked for; further than that reads as "not planned". */
const NEXT_HORIZON_DAYS = 14

/**
 * Days until the workout is next due and not yet done, counting today as 0;
 * null when nothing falls within the horizon.
 */
export function daysUntilNext(w: WorkoutView, todayKey: string, timezone: string): number | null {
  for (let i = 0; i <= NEXT_HORIZON_DAYS; i++) {
    const key = addDaysToKey(todayKey, i)
    if (isDueOn(w, key) && !isDoneOn(w, key, timezone)) return i
  }
  return null
}
