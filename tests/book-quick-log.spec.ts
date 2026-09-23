import { expect, test, type Page } from '@playwright/test'
import { recordOfflineShell, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const BOOK_TITLE = 'E2E quick-log book'

test.use({ viewport: { width: 390, height: 844 } })

async function clearBook(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  // Sessions and notes go with the book (on delete cascade).
  await db.from('books').delete().eq('user_id', userId).eq('title', BOOK_TITLE)
}

test.beforeEach(clearBook)
test.afterEach(clearBook)

async function insertBook(): Promise<string> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data, error } = await db
    .from('books')
    .insert({
      user_id: userId,
      title: BOOK_TITLE,
      status: 'reading',
      progress_mode: 'pages',
      current_unit: 10,
      total_units: 200,
      daily_goal: 20,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function currentUnit(id: string): Promise<number | undefined> {
  const db = await e2eClient()
  const { data } = await db.from('books').select('current_unit').eq('id', id).maybeSingle()
  return data?.current_unit
}

async function openBook(page: Page, id: string): Promise<void> {
  await page.goto(`/reading/${id}`)
  await expect(page.getByRole('heading', { name: BOOK_TITLE })).toBeVisible({ timeout: 20_000 })
}

test('one tap logs today’s goal, and the page moves before the server answers', async ({
  page,
}) => {
  const errors = watchConsole(page)
  const id = await insertBook()
  await signIn(page)
  await openBook(page, id)

  // Nothing read today yet, so the button offers the whole daily goal.
  await page.getByRole('button', { name: '+20 pages' }).click()
  await expect(page.getByText(/30\s+of\s+200/)).toBeVisible({ timeout: 1_000 })
  await expect.poll(() => currentUnit(id), { timeout: 15_000 }).toBe(30)

  // The stepper changes what the next tap logs.
  await page.getByRole('button', { name: 'Less' }).click()
  await page.getByRole('button', { name: '+15 pages' }).click()
  await expect.poll(() => currentUnit(id), { timeout: 15_000 }).toBe(45)
  expect(errors).toEqual([])
})

test('a tap made offline survives a reload and lands once back online', async ({
  page,
  context,
}) => {
  const id = await insertBook()
  const shell = await recordOfflineShell(context)
  await signIn(page)
  await openBook(page, id)

  await shell.offline()
  await page.getByRole('button', { name: '+20 pages' }).click()
  await expect(page.getByText(/30\s+of\s+200/)).toBeVisible()
  await page.reload()
  await expect(page.getByText(/30\s+of\s+200/)).toBeVisible({ timeout: 20_000 })

  await shell.online()
  await expect.poll(() => currentUnit(id), { timeout: 15_000 }).toBe(30)
})

test('an exact page is set from Edit, not from the page itself', async ({ page }) => {
  const id = await insertBook()
  await signIn(page)
  await openBook(page, id)

  await page.getByRole('button', { name: /^edit$/i }).click()
  await page.getByLabel('Current page').fill('120')
  await page.getByRole('button', { name: /save changes/i }).click()
  await expect(page.getByText(/120\s+of\s+200/)).toBeVisible()
  await expect.poll(() => currentUnit(id), { timeout: 15_000 }).toBe(120)
})
