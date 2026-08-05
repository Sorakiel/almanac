import { format, getISOWeek, parseISO } from 'date-fns'
import { weekdayOfKey } from '@/lib/date'
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
  /** Header label, e.g. "JUL · WEEK 28". */
  label: string
  days: WeekDay[]
}

const WEEKDAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
/** Dictionary keys for the strip, Monday-first to match WEEKDAY_SHORT. */
const WEEKDAY_STRIP_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/** Add whole days to a `YYYY-MM-DD` key using UTC math (no tz drift). */
function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const base = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  const next = new Date(base + days * 86_400_000)
  return next.toISOString().slice(0, 10)
}

/**
 * The Monday-anchored 7-day strip containing `todayKey`, each day carrying how
 * many workouts are due and how many were completed — the training week header.
 */
export function buildWeek(
  todayKey: string,
  workouts: WorkoutView[],
  timezone: string,
  t?: TFunction,
  locale = 'en-GB',
): WeekView {
  // weekdayOfKey is 0=Sun … 6=Sat; step back to this week's Monday.
  const mondayOffset = (weekdayOfKey(todayKey) + 6) % 7
  const monday = addDays(todayKey, -mondayOffset)

  const days: WeekDay[] = WEEKDAY_SHORT.map((weekday, i) => {
    const dateKey = addDays(monday, i)
    const due = workouts.filter((w) => isDueOn(w, dateKey))
    return {
      dateKey,
      weekday: t ? t(`workouts.weekdayStrip.${WEEKDAY_STRIP_KEYS[i]!}`) : weekday,
      dayOfMonth: Number(dateKey.slice(8, 10)),
      isToday: dateKey === todayKey,
      dueCount: due.length,
      doneCount: due.filter((w) => isDoneOn(w, dateKey, timezone)).length,
    }
  })

  const monthDate = parseISO(`${monday}T00:00:00`)
  const month = t
    ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(monthDate).toUpperCase()
    : format(monthDate, 'MMM').toUpperCase()
  const week = getISOWeek(monthDate)
  const label = t ? t('workouts.weekLabel', { month, week }) : `${month} · WEEK ${week}`

  return { label, days }
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
