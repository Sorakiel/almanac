import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'

test('switches between dark and coffee and remembers the choice', async ({ page }) => {
  const errors = watchConsole(page)
  await signIn(page)

  await page.goto('/settings')
  await page.getByRole('tab', { name: /coffee/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'coffee')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'coffee')

  await page.getByRole('tab', { name: /dark/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
})
