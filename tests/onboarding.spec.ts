import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId, E2E_EMAIL, E2E_PASSWORD } from './helpers/supabase'

const HOME_TIMEZONE = 'Europe/Moscow'

/**
 * Pin the browser's zone so the assertion is about what onboarding *wrote*, not
 * about where the test happens to run. CI runners are UTC, which is also the
 * column default — on a UTC machine "the timezone was adopted" and "nothing was
 * written" look identical.
 */
const DEVICE_TIMEZONE = 'Asia/Tokyo'
test.use({ timezoneId: DEVICE_TIMEZONE })

/**
 * Restore in afterEach, not in a `finally` inside the test: when Playwright
 * times a test out it aborts the body, so a finally block is not guaranteed to
 * run — and leaving `onboarded = false` behind breaks every later spec.
 */
test.afterEach(async () => {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('profiles').update({ onboarded: true, timezone: HOME_TIMEZONE }).eq('id', userId)
})

/**
 * The welcome flow is where `profiles.timezone` is written — FND-1's bug was
 * that skipping it left every account on UTC and silently corrupted streaks.
 * So this walks the real steps and asserts the profile they produce.
 */
test('walks the welcome flow and adopts the device timezone', async ({ page }) => {
  const errors = watchConsole(page)
  const db = await e2eClient()
  const userId = await e2eUserId(db)

  // Arrange: put the account back in its just-signed-up state.
  const { error } = await db
    .from('profiles')
    .update({ onboarded: false, timezone: 'UTC' })
    .eq('id', userId)
  if (error) throw error

  await page.goto('/auth')
  await page.getByLabel('Email').fill(E2E_EMAIL)
  await page.getByLabel('Password').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/welcome$/, { timeout: 20_000 })
  await expect(page.getByText(/welcome to/i)).toBeVisible()

  // Steps 1–3 → the Ready step, then finish without creating habits.
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: /^continue$/i }).click()
  }
  await page.getByRole('button', { name: /explore first/i }).click()

  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })

  await expect
    .poll(
      async () => {
        const { data } = await db
          .from('profiles')
          .select('onboarded, timezone')
          .eq('id', userId)
          .single()
        return `${String(data?.onboarded)}:${data?.timezone ?? ''}`
      },
      { timeout: 15_000 },
    )
    .toBe(`true:${DEVICE_TIMEZONE}`)

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})

test('an onboarded account goes straight to the dashboard', async ({ page }) => {
  await signIn(page)
  await expect(page).toHaveURL(/\/$/)
})
