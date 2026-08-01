import { expect, type Page } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from './supabase'

/** Sign in through the real auth form and wait for the app shell. */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/auth')
  await page.getByLabel('Email').fill(E2E_EMAIL)
  await page.getByLabel('Password').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
}

/**
 * Collect console errors for the lifetime of a test.
 *
 * Two kinds of noise are filtered out. Vite's HMR client chatter is obvious.
 * The 409s are not: `emitActivity` deliberately inserts a duplicate activity
 * event and swallows the unique-violation, so the browser logs a failed request
 * on a path the app handles on purpose. Everything else is a failure signal.
 */
export function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (text.includes('[vite]')) return
    if (text.includes('status of 409')) return
    errors.push(text)
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}
