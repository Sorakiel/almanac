import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'

test('signs in, lands on the dashboard, signs out', async ({ page }) => {
  const errors = watchConsole(page)

  // Anonymous users are routed to auth.
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth$/)

  await signIn(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible()

  await page.goto('/profile')
  // Signing out is behind a confirmation — the first click only opens the sheet.
  await page.getByRole('button', { name: /sign out/i }).click()
  const confirm = page.getByRole('dialog')
  await expect(confirm).toBeVisible()
  await expect(page).toHaveURL(/\/profile$/)
  await confirm.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/auth$/)

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})
