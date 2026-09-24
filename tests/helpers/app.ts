import { expect, type BrowserContext, type Page } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD, resetUserSettings } from './supabase'

/**
 * Sign in through the real auth form and wait for the app shell.
 *
 * Scoped to the `<form>` — the page also has a "Sign in with a passkey"
 * button outside it (RET-8), and `/sign in/i` alone now matches both.
 */
export async function signIn(
  page: Page,
  { keepSettings = false }: { keepSettings?: boolean } = {},
): Promise<void> {
  // Each spec starts from a neutral settings row unless it seeded one itself.
  if (!keepSettings) await resetUserSettings()
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

interface RecordedResponse {
  status: number
  headers: Record<string, string>
  body: Buffer
}

/**
 * Stand-in for the production service worker, which does not run under the
 * dev server: every app-shell response is recorded while online and replayed
 * once `offline()` is called, so `page.reload()` works with the network off.
 * Like the real worker, any navigation falls back to the recorded shell — the
 * SPA reaches `/` by client-side routing after sign-in, so that exact document
 * was never fetched. Supabase is not routed: its requests fail for real.
 */
export async function recordOfflineShell(context: BrowserContext): Promise<OfflineShell> {
  const recorded = new Map<string, RecordedResponse>()
  let shellDocument: RecordedResponse | undefined
  let offline = false
  await context.route(
    (url) => url.hostname === 'localhost',
    async (route) => {
      const url = route.request().url()
      if (offline) {
        const hit =
          recorded.get(url) ?? (route.request().isNavigationRequest() ? shellDocument : undefined)
        return hit ? route.fulfill(hit) : route.abort('internetdisconnected')
      }
      try {
        const response = await route.fetch()
        const entry = {
          status: response.status(),
          headers: response.headers(),
          body: await response.body(),
        }
        recorded.set(url, entry)
        if (route.request().isNavigationRequest()) shellDocument = entry
        return await route.fulfill(entry)
      } catch {
        // The page navigated away (a reload) while this request was in flight,
        // or the dev server dropped it: nobody is waiting for the answer. Letting
        // the handler throw failed the whole test — a flake, not an app bug.
        return route.abort().catch(() => undefined)
      }
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

/**
 * Open the ⌘K palette from the keyboard. The shortcut listener lives in the
 * app shell, which mounts after the session and profile resolve — a key pressed
 * straight after navigation lands on the boot skeleton and is lost. The
 * toolbar's search pill renders with the shell, so it marks "listening".
 */
export async function openPalette(page: Page): Promise<void> {
  await expect(page.locator('button[aria-keyshortcuts="Meta+K"]')).toBeVisible({ timeout: 20_000 })
  await page.keyboard.press('ControlOrMeta+k')
  await expect(page.getByRole('combobox')).toBeFocused()
}

/**
 * Unfold Today's "Done" section. A ticked habit holds its row for a moment,
 * then folds into this disclosure, which starts closed — so a spec that wants
 * the ticked row back in view has to wait for the section and open it.
 */
export async function openDoneSection(page: Page): Promise<void> {
  const disclosure = page.getByRole('button', { name: /^(done|готово)\b/i })
  await expect(disclosure).toBeVisible({ timeout: 20_000 })
  if ((await disclosure.getAttribute('aria-expanded')) === 'false') await disclosure.click()
}
