import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'

test('signs in, lands on the dashboard, signs out', async ({ page }) => {
  const errors = watchConsole(page)

  // Anonymous users are routed to auth.
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth$/)

  await signIn(page)
  await expect(page.getByText(/today · habits/i)).toBeVisible()

  await page.goto('/settings')
  // Signing out is behind a confirmation — the first click only opens the sheet.
  await page.getByRole('button', { name: /sign out/i }).click()
  const confirm = page.getByRole('dialog')
  await expect(confirm).toBeVisible()
  await expect(page).toHaveURL(/\/settings$/)
  await confirm.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/auth$/)

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})
