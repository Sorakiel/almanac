import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E counted habit'

test.use({ viewport: { width: 390, height: 844 } })

async function clearRows(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('habits').delete().eq('user_id', userId).eq('name', HABIT_NAME)
}

test.beforeEach(clearRows)
test.afterEach(clearRows)

async function insertCountedHabit(): Promise<string> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data, error } = await db
    .from('habits')
    .insert({
      user_id: userId,
      name: HABIT_NAME,
      frequency: 'daily',
      target_count: 1,
      daily_goal: 3,
      unit: 'glasses',
      time_of_day: 'anytime',
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** Today's count as the server has it; the spec's habit has at most one log. */
async function loggedCount(habitId: string): Promise<number> {
  const db = await e2eClient()
  const { data } = await db.from('habit_logs').select('count').eq('habit_id', habitId)
  return data?.[0]?.count ?? 0
}

async function loggedNote(habitId: string): Promise<string | null> {
  const db = await e2eClient()
  const { data } = await db.from('habit_logs').select('note').eq('habit_id', habitId)
  return data?.[0]?.note ?? null
}

test('a counted habit fills one tap at a time and steps back on its page', async ({ page }) => {
  const errors = watchConsole(page)
  const id = await insertCountedHabit()
  await signIn(page)

  // Today: each tap is one glass, and the row says how far along it is.
  const add = (count: number) =>
    page.getByRole('button', { name: `Add one to “${HABIT_NAME}”, ${count} of 3` })
  await expect(add(0)).toBeVisible({ timeout: 20_000 })
  await add(0).click()
  await expect(page.getByText('1/3')).toBeVisible()
  await add(1).click()
  await expect.poll(() => loggedCount(id), { timeout: 15_000 }).toBe(2)
  await add(2).click()
  // The third closes the day: the row settles into "Done".
  await expect(add(2)).toHaveCount(0, { timeout: 5_000 })
  await expect.poll(() => loggedCount(id), { timeout: 15_000 }).toBe(3)

  // The habit's page steps one unit back rather than clearing the day.
  await page.goto(`/habits/${id}`)
  await expect(page.getByRole('heading', { name: HABIT_NAME })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('3/3')).toBeVisible()
  await page.getByRole('button', { name: /^decrease$/i }).click()
  await expect(page.getByText('2/3')).toBeVisible()
  await expect.poll(() => loggedCount(id), { timeout: 15_000 }).toBe(2)

  // A marked day takes a note, saved when the field is left.
  const note = page.getByLabel('Note for today')
  await note.fill('In the rain')
  await note.blur()
  await expect.poll(() => loggedNote(id), { timeout: 15_000 }).toBe('In the rain')
  expect(errors).toEqual([])
})
