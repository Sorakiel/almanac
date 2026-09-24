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
    await expect(page).toHaveURL(/\/insights$/)
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
  await expect(page).toHaveURL(/\/insights$/)
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(errors).toEqual([])
})
