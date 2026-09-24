import { expect, test, type Page } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E create-sheet habit'

async function dropHabit(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('habits').delete().eq('user_id', userId).eq('name', HABIT_NAME)
}

test.beforeEach(dropHabit)
test.afterEach(dropHabit)

const sheet = (page: Page) => page.getByRole('dialog', { name: 'Create' })

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('"+" opens the sheet; the quick form creates a habit without waiting', async ({ page }) => {
    const errors = watchConsole(page)
    await signIn(page)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await expect(sheet(page)).toBeVisible()

    await sheet(page)
      .getByRole('button', { name: /^habit/i })
      .click()
    const form = page.getByRole('dialog', { name: 'New habit' })
    await form.getByLabel('Habit name').fill(HABIT_NAME)
    await form.getByRole('radio', { name: 'Weekdays' }).click()
    await form.getByRole('radio', { name: 'Evening' }).click()
    await form.getByRole('button', { name: /^create$/i }).click()
    await expect(form).toBeHidden({ timeout: 3_000 })

    const db = await e2eClient()
    await expect
      .poll(
        async () => {
          const { data } = await db
            .from('habits')
            .select('frequency, time_of_day')
            .eq('name', HABIT_NAME)
            .maybeSingle()
          return data
        },
        { timeout: 15_000 },
      )
      .toEqual({ frequency: 'weekdays', time_of_day: 'evening' })
    expect(errors).toEqual([])
  })

  test('the close button and Escape both dismiss it', async ({ page }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await sheet(page).getByRole('button', { name: 'Close' }).click()
    await expect(sheet(page)).toBeHidden()

    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await expect(sheet(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet(page)).toBeHidden()
  })
})

test('on desktop the sidebar’s Create opens the same sheet as a modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signIn(page)
  // The sidebar's comes first; the toolbar "+" beside the search pill is the same action.
  await page.getByRole('button', { name: 'Create', exact: true }).first().click()
  await expect(sheet(page)).toBeVisible()
  await expect(sheet(page).getByRole('button', { name: /^habit/i })).toBeVisible()
})
