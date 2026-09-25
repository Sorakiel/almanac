import { expect, test } from '@playwright/test'
import { openPalette, signIn, watchConsole } from './helpers/app'

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('tab bar: Today · Progress · Modules, with "+" standing apart', async ({ page }) => {
    const errors = watchConsole(page)
    await signIn(page)
    const tabs = page.getByRole('navigation', { name: 'Primary' }).getByRole('link')
    await expect(tabs).toHaveText(['Today', 'Progress', 'Modules'])
    await expect(tabs.first()).toHaveAttribute('aria-current', 'page')

    await tabs.nth(1).click()
    await expect(page).toHaveURL(/\/progress$/)
    await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'page')

    // A module opened from the hub still belongs to the Modules tab.
    await page.goto('/habits')
    await expect(tabs.nth(2)).toHaveAttribute('aria-current', 'page')

    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })
})

test('⌘K palette runs a command from the keyboard', async ({ page }) => {
  const errors = watchConsole(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await signIn(page)
  await openPalette(page)
  const input = page.getByRole('combobox')
  await input.fill('progress')
  await expect(page.getByRole('option', { selected: true })).toHaveText(/Open “Progress”/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/progress$/)
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(errors).toEqual([])
})

// A dense dashboard on a big monitor stays a readable column (max-w-5xl, 1024px)
// instead of running edge to edge — the owner's window is ~1970px wide.
test('Progress and Profile keep a bounded column on a wide window', async ({ page }) => {
  await page.setViewportSize({ width: 1970, height: 1100 })
  await signIn(page)
  for (const [path, heading] of [
    ['/progress', 'Progress'],
    ['/profile', 'Profile'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByText(heading, { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    const widest = await page
      .locator('main .lg\\:max-w-5xl')
      .evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().width)))
    expect(widest, `${path} column width`).toBeLessThanOrEqual(1024)
    expect(widest, `${path} column width`).toBeGreaterThan(600)
  }
})
