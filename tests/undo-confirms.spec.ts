import { expect, test, type Page } from '@playwright/test'
import { recordOfflineShell, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

// A date no real entry has, so the spec never touches the account's own
// reflections and `unique(user_id, date)` can't collide with them.
const REFLECTION_DATE = '2001-01-01'
const REFLECTION_BODY = 'E2E reflection to delete'
const HABIT_NAME = 'E2E habit to delete'
const BOOK_TITLE = 'E2E book to delete'
const WORKOUT_NAME = 'E2E workout to delete'

// The reflection list and the habit options menu are the phone layout.
test.use({ viewport: { width: 390, height: 844 } })

async function clearRows(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('reflections').delete().eq('user_id', userId).eq('date', REFLECTION_DATE)
  await db.from('habits').delete().eq('user_id', userId).eq('name', HABIT_NAME)
  await db.from('books').delete().eq('user_id', userId).eq('title', BOOK_TITLE)
  await db.from('workouts').delete().eq('user_id', userId).eq('name', WORKOUT_NAME)
}

// Before as well as after: a run killed mid-test leaves its row behind.
test.beforeEach(clearRows)
test.afterEach(clearRows)

async function insertRow(
  table: 'habits' | 'books' | 'workouts' | 'reflections',
  row: Record<string, unknown>,
): Promise<string> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data, error } = await db
    .from(table)
    .insert({ ...row, user_id: userId } as never)
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

async function rowExists(table: 'habits' | 'books' | 'workouts' | 'reflections', id: string) {
  const db = await e2eClient()
  const { data } = await db.from(table).select('id').eq('id', id).maybeSingle()
  return data !== null
}

const undo = (page: Page) => page.getByRole('button', { name: /^undo$/i })

test('a deleted reflection disappears at once and Undo brings it back', async ({ page }) => {
  const errors = watchConsole(page)
  const id = await insertRow('reflections', {
    date: REFLECTION_DATE,
    body: REFLECTION_BODY,
    mood: 3,
  })
  await signIn(page)
  await page.goto('/reflect')
  const body = page.getByText(REFLECTION_BODY)
  await expect(body).toBeVisible({ timeout: 20_000 })

  // The innermost element holding both the body and a delete button is the card.
  const card = page
    .locator('div', { hasText: REFLECTION_BODY })
    .filter({ has: page.getByRole('button', { name: /delete reflection/i }) })
    .last()
  await card.getByRole('button', { name: /delete reflection/i }).click()
  await expect(body).toHaveCount(0)

  await undo(page).click()
  await expect(body).toBeVisible()
  await expect.poll(() => rowExists('reflections', id), { timeout: 15_000 }).toBe(true)

  // Without Undo the delete stands.
  await card.getByRole('button', { name: /delete reflection/i }).click()
  await expect(body).toHaveCount(0)
  await expect.poll(() => rowExists('reflections', id), { timeout: 15_000 }).toBe(false)
  expect(errors).toEqual([])
})

test('a habit archives with Undo, and deletes for good only after a confirm', async ({ page }) => {
  const errors = watchConsole(page)
  const id = await insertRow('habits', { name: HABIT_NAME, frequency: 'daily', target_count: 1 })
  await signIn(page)

  await page.goto(`/habits/${id}`)
  await expect(page.getByRole('heading', { name: HABIT_NAME })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /habit options/i }).click()
  await page.getByRole('button', { name: /archive habit/i }).click()
  await expect(page).toHaveURL(/\/habits$/)
  await undo(page).click()
  await expect(page.getByRole('link', { name: HABIT_NAME })).toBeVisible()

  await page.goto(`/habits/${id}`)
  await expect(page.getByRole('heading', { name: HABIT_NAME })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /habit options/i }).click()
  await page.getByRole('button', { name: /delete habit/i }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /delete forever/i })
    .click()
  await expect(page).toHaveURL(/\/habits$/)
  await expect.poll(() => rowExists('habits', id), { timeout: 15_000 }).toBe(false)
  expect(errors).toEqual([])
})

test('a book deleted offline leaves at once and is gone once back online', async ({
  page,
  context,
}) => {
  const id = await insertRow('books', { title: BOOK_TITLE })
  const shell = await recordOfflineShell(context)
  await signIn(page)
  // Warm the library route, as the production precache would.
  await page.goto('/reading')
  await expect(page.getByText(BOOK_TITLE).first()).toBeVisible({ timeout: 20_000 })
  await page.goto(`/reading/${id}`)
  await expect(page.getByRole('heading', { name: BOOK_TITLE })).toBeVisible({ timeout: 20_000 })

  await shell.offline()
  await page.getByRole('button', { name: /^edit$/i }).click()
  await page.getByRole('button', { name: /remove book/i }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /remove book/i })
    .click()
  // Never waits on the network: offline the delete queues.
  await expect(page).toHaveURL(/\/reading$/, { timeout: 3_000 })
  await expect(page.getByText(BOOK_TITLE)).toHaveCount(0)

  await shell.online()
  await expect.poll(() => rowExists('books', id), { timeout: 15_000 }).toBe(false)
})

test('a workout deleted offline leaves at once and is gone once back online', async ({
  page,
  context,
}) => {
  const id = await insertRow('workouts', { name: WORKOUT_NAME })
  const shell = await recordOfflineShell(context)
  await signIn(page)
  await page.goto('/train')
  await expect(page.getByText(WORKOUT_NAME).first()).toBeVisible({ timeout: 20_000 })
  await page.goto(`/train/${id}`)
  await expect(page.getByRole('heading', { name: WORKOUT_NAME })).toBeVisible({ timeout: 20_000 })

  await shell.offline()
  await page.getByRole('button', { name: /schedule & delete/i }).click()
  await page.getByRole('button', { name: /delete workout/i }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /delete workout/i })
    .click()
  await expect(page).toHaveURL(/\/train$/, { timeout: 3_000 })
  await expect(page.getByText(WORKOUT_NAME)).toHaveCount(0)

  await shell.online()
  await expect.poll(() => rowExists('workouts', id), { timeout: 15_000 }).toBe(false)
})
