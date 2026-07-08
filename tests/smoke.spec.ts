import { test, expect, type ConsoleMessage } from '@playwright/test'

/**
 * Phase-1 smoke checklist (CLAUDE.md §9). Requires a live Supabase project with
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

  // 2. Sign up a fresh test user.
  const email = `smoke-${Date.now()}@example.com`
  await page.getByRole('button', { name: /create one/i }).click()
  await page.getByLabel('Name').fill('Smoke Tester')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /create account/i }).click()

  // 3. Dashboard renders after auth.
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
  await expect(page.getByText(/today's habits/i)).toBeVisible()

  // 4. Create a habit → it appears.
  await page.getByRole('button', { name: /add habit/i }).first().click()
  await page.getByLabel('Name').fill('Read 20 pages')
  await page.getByRole('button', { name: /create habit/i }).click()
  const habit = page.getByText('Read 20 pages')
  await expect(habit).toBeVisible()

  // 5. Complete it → optimistic, and persists after reload.
  await page.getByRole('button', { name: /^complete read 20 pages$/i }).click()
  const completeToggle = page.getByRole('button', { name: /mark read 20 pages incomplete/i })
  await expect(completeToggle).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: /mark read 20 pages incomplete/i })).toBeVisible()

  // 6. Toggle theme dark ↔ coffee.
  const html = page.locator('html')
  const before = await html.getAttribute('data-theme')
  await page.getByRole('button', { name: /toggle theme/i }).click()
  await expect(html).not.toHaveAttribute('data-theme', before ?? 'dark')

  // 7. Sign out returns to auth.
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/auth$/)

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([])
})
