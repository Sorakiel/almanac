import { expect, test } from '@playwright/test'
import { E2E_EMAIL } from './helpers/supabase'

/**
 * A failure reads as a sentence from the app, not as the server's raw English.
 * One wrong-password attempt per run — well under Auth's rate limit, and it
 * never touches the shared account's data.
 */
test('a wrong password says so in the app’s own words', async ({ page }) => {
  await page.goto('/auth')
  await page.getByLabel('Email').fill(E2E_EMAIL)
  await page.getByLabel('Password').fill('definitely-not-the-password')
  await page
    .locator('form')
    .getByRole('button', { name: /sign in/i })
    .click()

  const toast = page.locator('[data-sonner-toast]').first()
  await expect(toast).toContainText('Wrong email or password', { timeout: 15_000 })
  await expect(toast).not.toContainText('Invalid login credentials')
  await expect(page).toHaveURL(/\/auth$/)
})
