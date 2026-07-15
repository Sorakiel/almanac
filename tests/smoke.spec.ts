import { expect, test, type ConsoleMessage } from '@playwright/test'

/**
 * Phase-1 smoke checklist. Requires a live Supabase project with
 * email confirmations disabled so a fresh sign-up is immediately authenticated.
 */
test('almanac phase-1 smoke', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // 1. App loads and routes anonymous users to auth.
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth$/)
  await expect(page.getByLabel(/remember me/i)).toBeVisible()

  // 2. Sign up a fresh test user. Note: Supabase's email validator rejects
  // throwaway domains like example.com, and this flow assumes email
  // confirmation is DISABLED so the sign-up issues a session immediately.
  const email = `almanac.smoke.${Date.now()}@gmail.com`
  await page.getByRole('tab', { name: /create account/i }).click()
  await page.getByLabel('Name').fill('Smoke Tester')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /create account/i }).click()

  // 3. New users land on the 3-step welcome flow; skip through it to the app.
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 15_000 })
  await page.getByRole('button', { name: /^skip$/i }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
  await expect(page.getByText(/today · habits/i)).toBeVisible()

  // 4. Create a habit → it appears (with the focus block once habits exist).
  await page
    .getByRole('button', { name: /add habit/i })
    .first()
    .click()
  await page.getByLabel('Name').fill('Read 20 pages')
  await page.getByRole('button', { name: /create habit/i }).click()
  await expect(page.getByRole('link', { name: 'Read 20 pages' })).toBeVisible()

  // 5. Complete it → optimistic, and persists after reload. Wait for the
  // habit_logs write to settle before reloading, or the reload races it.
  const logWrite = page.waitForResponse(
    (r) => r.url().includes('habit_logs') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /^complete read 20 pages$/i }).click()
  const completeToggle = page.getByRole('button', { name: /mark read 20 pages incomplete/i })
  await expect(completeToggle).toBeVisible()
  await logWrite
  await page.reload()
  await expect(page.getByRole('button', { name: /mark read 20 pages incomplete/i })).toBeVisible()

  // 6. Toggle theme dark ↔ coffee (Settings → Appearance).
  await page.goto('/settings')
  await page.getByRole('tab', { name: /coffee/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'coffee')

  // 7. Sign out returns to auth.
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/auth$/)

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([])
})
