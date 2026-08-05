import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E offline tap'

test.afterEach(async () => {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('habits').delete().eq('user_id', userId).eq('name', HABIT_NAME)
})

test('a habit tapped offline lands on the server once the connection returns', async ({
  page,
  context,
}) => {
  const errors = watchConsole(page)
  await signIn(page)

  await page
    .getByRole('button', { name: /add habit/i })
    .first()
    .click()
  await page.getByLabel('Name').fill(HABIT_NAME)
  await page.getByRole('button', { name: /create habit/i }).click()
  await expect(page.getByRole('link', { name: HABIT_NAME })).toBeVisible()

  await context.setOffline(true)

  // The tap must still land instantly (optimistic) with no network available.
  await page.getByRole('button', { name: new RegExp(`^complete ${HABIT_NAME}$`, 'i') }).click()
  await expect(
    page.getByRole('button', { name: new RegExp(`mark ${HABIT_NAME} incomplete`, 'i') }),
  ).toBeVisible()

  // Give the mutation a moment to actually reach paused state before
  // reconnecting — otherwise this races the retryer's own pause.
  await page.waitForTimeout(300)

  const logWrite = page.waitForResponse(
    (r) => r.url().includes('habit_logs') && r.request().method() === 'POST',
    { timeout: 15_000 },
  )
  await context.setOffline(false)
  await logWrite

  // Confirm it actually persisted, not just that a request fired.
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data: habit } = await db
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('name', HABIT_NAME)
    .single()
  const { data: log } = await db
    .from('habit_logs')
    .select('count')
    .eq('habit_id', habit?.id)
    .single()
  expect(log?.count).toBe(1)

  // Forcing the browser offline necessarily fails any in-flight resource load
  // with this error — expected noise from the test setup, not the app.
  const realErrors = errors.filter((e) => !e.includes('ERR_INTERNET_DISCONNECTED'))
  expect(realErrors, `console errors:\n${realErrors.join('\n')}`).toEqual([])
})
