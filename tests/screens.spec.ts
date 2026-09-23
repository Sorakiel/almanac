import { expect, test, type Page } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

/**
 * Visual smoke: walk the main screens at phone and desktop width, in both
 * themes and both languages, and save a screenshot of each. CI uploads the
 * folder, which is how a change to a signed-in screen gets looked at without
 * anyone typing the shared account's password into a browser.
 *
 * The assertions are the cheap, real ones — no console errors, and no page
 * wider than the viewport (the phone-layout regression that screenshots are
 * worst at catching by eye).
 */

const OUT = 'screenshots'

// The project's review standard: every PR with UI is looked at in Russian, at
// phone and desktop width, in both themes — four shots per screen. English is
// covered by every other spec, which all run in it.
const VARIANTS = [
  { name: 'phone-dark-ru', width: 390, height: 844, theme: 'dark', locale: 'ru' },
  { name: 'phone-coffee-ru', width: 390, height: 844, theme: 'coffee', locale: 'ru' },
  { name: 'desktop-dark-ru', width: 1440, height: 900, theme: 'dark', locale: 'ru' },
  { name: 'desktop-coffee-ru', width: 1440, height: 900, theme: 'coffee', locale: 'ru' },
] as const

const SCREENS = ['/', '/insights', '/flow', '/settings', '/social', '/habits'] as const

/**
 * A habit with a few months of history, so Insights draws the year strip
 * instead of its empty state. Removed before and after, like every spec's rows.
 */
const SEED_HABIT = 'E2E screens · daily pages'
const SEED_DAYS = 120

async function dropSeed(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { error } = await db.from('habits').delete().eq('user_id', userId).eq('name', SEED_HABIT)
  if (error) throw new Error(`could not clear the screens seed: ${error.message}`)
}

async function seedHistory(): Promise<void> {
  await dropSeed()
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const day = (offset: number) =>
    new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await db
    .from('habits')
    .insert({
      user_id: userId,
      name: SEED_HABIT,
      frequency: 'daily',
      created_at: `${day(SEED_DAYS)}T00:00:00Z`,
    })
    .select('id')
    .single()
  if (error) throw new Error(`could not seed the screens habit: ${error.message}`)
  // Deterministic gaps (every 4th and 7th day missed) so weeks land at different fills.
  const logs = Array.from({ length: SEED_DAYS }, (_, i) => i + 1)
    .filter((i) => i % 4 !== 0 && i % 7 !== 0)
    .map((i) => ({ user_id: userId, habit_id: data.id, date: day(i), count: 1 }))
  const { error: logError } = await db.from('habit_logs').insert(logs)
  if (logError) throw new Error(`could not seed the screens logs: ${logError.message}`)
}

test.beforeEach(seedHistory)
test.afterEach(dropSeed)

async function applyPrefs(page: Page, theme: string, locale: string): Promise<void> {
  await page.evaluate(
    ([th, lo]) => {
      localStorage.setItem('almanac-theme', JSON.stringify({ state: { theme: th }, version: 0 }))
      localStorage.setItem('almanac-locale', JSON.stringify({ state: { locale: lo }, version: 0 }))
    },
    [theme, locale],
  )
  await page.reload()
}

async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow, `${label} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1)
}

async function shoot(page: Page, file: string): Promise<void> {
  // Let entrance cascades settle so the capture shows the resting layout.
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true })
}

for (const v of VARIANTS) {
  test(`screens · ${v.name}`, async ({ page }) => {
    test.setTimeout(120_000)
    const errors = watchConsole(page)
    await page.setViewportSize({ width: v.width, height: v.height })
    await signIn(page)
    await applyPrefs(page, v.theme, v.locale)
    await expect(page.locator('html')).toHaveAttribute('data-theme', v.theme)
    await expect(page.locator('html')).toHaveAttribute('lang', v.locale)

    await page.goto('/insights')
    await expect(page.getByRole('group', { name: /2\d{3}/ })).toBeVisible()

    for (const path of SCREENS) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const slug = path === '/' ? 'dashboard' : path.slice(1)
      await expectNoHorizontalScroll(page, `${v.name} ${path}`)
      await shoot(page, `${v.name}-${slug}`)
    }

    // The custom-length stepper only exists once "custom" is picked.
    await page.goto('/flow')
    await page.getByRole('radio', { name: v.locale === 'ru' ? 'Своя' : 'Custom' }).click()
    await expect(
      page.getByRole('spinbutton', {
        name: v.locale === 'ru' ? 'Своя длительность в минутах' : 'Custom length in minutes',
      }),
    ).toBeVisible()
    await shoot(page, `${v.name}-flow-custom`)

    // Password sheet: opened only, never submitted — the shared account's password stays put.
    await page.goto('/settings')
    await page.getByRole('button', { name: v.locale === 'ru' ? /Пароль/ : /Password/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await shoot(page, `${v.name}-settings-password`)
    await page.keyboard.press('Escape')

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
  })
}
