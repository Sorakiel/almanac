import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E read 20 pages'

test.afterEach(async () => {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('habits').delete().eq('user_id', userId).eq('name', HABIT_NAME)
})

test('creates a habit, completes it, and the completion survives a reload', async ({ page }) => {
  const errors = watchConsole(page)
  await signIn(page)

  await page
    .getByRole('button', { name: /add habit/i })
    .first()
    .click()
  await page.getByLabel('Name').fill(HABIT_NAME)
  await page.getByRole('button', { name: /create habit/i }).click()
  await expect(page.getByRole('link', { name: HABIT_NAME })).toBeVisible()

  // The toggle is optimistic, so assert the flipped state before the write
  // settles — that instant feedback is the retention-critical part.
  const logWrite = page.waitForResponse(
    (r) => r.url().includes('habit_logs') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: new RegExp(`^complete ${HABIT_NAME}$`, 'i') }).click()
  await expect(
    page.getByRole('button', { name: new RegExp(`mark ${HABIT_NAME} incomplete`, 'i') }),
  ).toBeVisible()
  await logWrite

  await page.reload()
  await expect(
    page.getByRole('button', { name: new RegExp(`mark ${HABIT_NAME} incomplete`, 'i') }),
  ).toBeVisible()

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})
