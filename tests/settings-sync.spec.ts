import { expect, test } from '@playwright/test'
import { recordOfflineShell, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId, resetUserSettings } from './helpers/supabase'

// Whatever a spec here leaves in the row must not repaint the next spec.
test.afterEach(resetUserSettings)

async function savedTheme(): Promise<string | null | undefined> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data } = await db
    .from('user_settings')
    .select('theme')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.theme
}

test.describe('in a dark-scheme browser', () => {
  // So nothing but the account can make the page coffee: with the OS in light
  // mode a default of "system" would paint coffee on its own.
  test.use({ colorScheme: 'dark' })

  test('a theme chosen on another device is applied on sign-in', async ({ page }) => {
    const errors = watchConsole(page)
    const db = await e2eClient()
    const userId = await e2eUserId(db)
    const { error } = await db
      .from('user_settings')
      .upsert({ user_id: userId, theme: 'coffee' }, { onConflict: 'user_id' })
    if (error) throw error

    // A fresh browser: nothing chosen locally, so the account's choice wins.
    await signIn(page, { keepSettings: true })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'coffee', { timeout: 15_000 })
    expect(errors).toEqual([])
  })
})

test('a theme picked here is saved to the account, even when picked offline', async ({
  page,
  context,
}) => {
  const shell = await recordOfflineShell(context)
  await signIn(page)
  await page.goto('/settings')
  await page.getByRole('tab', { name: /coffee/i }).click()
  await expect.poll(savedTheme, { timeout: 15_000 }).toBe('coffee')

  await shell.offline()
  await page.getByRole('tab', { name: /dark/i }).click()
  // The theme lands a frame later, inside the view-transition callback.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.getByRole('tab', { name: /dark/i })).toHaveAttribute('aria-selected', 'true', {
    timeout: 20_000,
  })
  await shell.online()
  await expect.poll(savedTheme, { timeout: 15_000 }).toBe('dark')
})
