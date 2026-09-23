import { expect, type BrowserContext, type Page } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from './supabase'

/**
 * Sign in through the real auth form and wait for the app shell.
 *
 * Scoped to the `<form>` — the page also has a "Sign in with a passkey"
 * button outside it (RET-8), and `/sign in/i` alone now matches both.
 */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/auth')
  await page.getByLabel('Email').fill(E2E_EMAIL)
  await page.getByLabel('Password').fill(E2E_PASSWORD)
  await page
    .locator('form')
    .getByRole('button', { name: /sign in/i })
    .click()
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

export interface OfflineShell {
  /** Cut the network, keep serving the app shell from what was recorded. */
  offline(): Promise<void>
  online(): Promise<void>
}

/**
 * Stand-in for the production service worker, which does not run under the
 * dev server: every app-shell response is recorded while online and replayed
 * once `offline()` is called, so `page.reload()` works with the network off.
 * Supabase is not routed — its requests fail for real, which is the point.
 */
export async function recordOfflineShell(context: BrowserContext): Promise<OfflineShell> {
  const recorded = new Map<
    string,
    { status: number; headers: Record<string, string>; body: Buffer }
  >()
  let offline = false
  await context.route(
    (url) => url.hostname === 'localhost',
    async (route) => {
      const url = route.request().url()
      if (offline) {
        const hit = recorded.get(url)
        return hit ? route.fulfill(hit) : route.abort('internetdisconnected')
      }
      const response = await route.fetch()
      const entry = {
        status: response.status(),
        headers: response.headers(),
        body: await response.body(),
      }
      recorded.set(url, entry)
      return route.fulfill(entry)
    },
  )
  return {
    offline: async () => {
      offline = true
      await context.setOffline(true)
    },
    online: async () => {
      await context.setOffline(false)
      offline = false
    },
  }
}
