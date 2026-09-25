import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const WORKOUT_NAME = 'E2E push day'
const EXERCISE_NAME = 'E2E bench press'

// In afterEach rather than a `finally`: a timed-out test never reaches its own
// cleanup, and leftovers would pile up in the shared account.
test.afterEach(async () => {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('workouts').delete().eq('user_id', userId).eq('name', WORKOUT_NAME)
  await db.from('exercises').delete().eq('user_id', userId).eq('name', EXERCISE_NAME)
})

/**
 * The plan is arranged through the API and only the live session is driven
 * through the UI — building a workout by hand is a long click path that tests
 * the form, not the thing worth guarding: ticking sets and finishing.
 */
test('runs a live workout session and marks the workout done', async ({ page }) => {
  const errors = watchConsole(page)
  const db = await e2eClient()
  const userId = await e2eUserId(db)

  const { data: workout, error: workoutError } = await db
    .from('workouts')
    .insert({ user_id: userId, name: WORKOUT_NAME })
    .select('id')
    .single()
  if (workoutError) throw workoutError

  const { data: exercise, error: exerciseError } = await db
    .from('exercises')
    .insert({ user_id: userId, name: EXERCISE_NAME })
    .select('id')
    .single()
  if (exerciseError) throw exerciseError

  const { data: link, error: linkError } = await db
    .from('workout_exercises')
    .insert({ workout_id: workout.id, exercise_id: exercise.id, target_sets: 2, target_reps: 8 })
    .select('id')
    .single()
  if (linkError) throw linkError

  // Sets are real rows, not derived from target_sets — without them the session
  // renders as already complete.
  const { error: setsError } = await db.from('set_logs').insert([
    { workout_exercise_id: link.id, set_number: 1, reps: 8, weight: 40 },
    { workout_exercise_id: link.id, set_number: 2, reps: 8, weight: 40 },
  ])
  if (setsError) throw setsError

  await signIn(page)
  await page.goto(`/train/${workout.id}/session`)
  await expect(page.getByText(EXERCISE_NAME, { exact: false })).toBeVisible({ timeout: 20_000 })

  // Tick the first set, then finish from the session menu.
  await page.getByRole('button', { name: /complete set 1/i }).click()
  await expect(page.getByRole('button', { name: /complete set 2/i })).toBeVisible()

  await page.getByRole('button', { name: /session options/i }).click()
  await page.getByRole('button', { name: /finish workout/i }).click()
  // No modal to dismiss: a quiet toast, and the runner steps back to the workout.
  await expect(page).toHaveURL(new RegExp(`/train/${workout.id}$`))
  await expect(page.getByText(/workout .* done/i)).toBeVisible()

  await expect
    .poll(
      async () => {
        const { data } = await db
          .from('workouts')
          .select('completed_at')
          .eq('id', workout.id)
          .single()
        return data?.completed_at !== null
      },
      { timeout: 15_000 },
    )
    .toBe(true)

  // The tick lands in the day's session; the plan rows stay a plan.
  const { data: sessions } = await db
    .from('workout_sessions')
    .select('completed_at, set_logs(set_number, done)')
    .eq('workout_id', workout.id)
  expect(sessions).toHaveLength(1)
  expect(sessions?.[0]?.completed_at).not.toBeNull()
  expect(sessions?.[0]?.set_logs).toEqual([{ set_number: 1, done: true }])
  const { data: plan } = await db
    .from('set_logs')
    .select('done')
    .eq('workout_exercise_id', link.id)
    .is('session_id', null)
  expect(plan?.every((row) => !row.done)).toBe(true)

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})

test('a daily workout finished yesterday starts today unticked', async ({ page }) => {
  const errors = watchConsole(page)
  const db = await e2eClient()
  const userId = await e2eUserId(db)

  const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000)
  const { data: workout, error: workoutError } = await db
    .from('workouts')
    .insert({
      user_id: userId,
      name: WORKOUT_NAME,
      recurrence: 'daily',
      completed_at: yesterday.toISOString(),
    })
    .select('id')
    .single()
  if (workoutError) throw workoutError
  const { data: exercise, error: exerciseError } = await db
    .from('exercises')
    .insert({ user_id: userId, name: EXERCISE_NAME })
    .select('id')
    .single()
  if (exerciseError) throw exerciseError
  const { data: link, error: linkError } = await db
    .from('workout_exercises')
    .insert({ workout_id: workout.id, exercise_id: exercise.id, target_sets: 1, target_reps: 8 })
    .select('id')
    .single()
  if (linkError) throw linkError
  const { error: planError } = await db
    .from('set_logs')
    .insert({ workout_exercise_id: link.id, set_number: 1, reps: 8, weight: 40 })
  if (planError) throw planError
  const { data: session, error: sessionError } = await db
    .from('workout_sessions')
    .insert({
      user_id: userId,
      workout_id: workout.id,
      date: yesterday.toISOString().slice(0, 10),
      completed_at: yesterday.toISOString(),
    })
    .select('id')
    .single()
  if (sessionError) throw sessionError
  const { error: logError } = await db.from('set_logs').insert({
    workout_exercise_id: link.id,
    set_number: 1,
    reps: 8,
    weight: 40,
    done: true,
    session_id: session.id,
  })
  if (logError) throw logError

  await signIn(page)
  await page.goto(`/train/${workout.id}/session`)
  await expect(page.getByText(EXERCISE_NAME, { exact: false })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /complete set 1/i })).toBeVisible()

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})
