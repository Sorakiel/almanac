import { expect, test } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

// Written into today's entry by typing — the marker the cleanup finds it by.
const BODY = 'E2E autosave entry'

async function clearRows(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('reflections').delete().eq('user_id', userId).eq('body', BODY)
}

// Before as well as after: a run killed mid-test leaves its row behind.
test.beforeEach(clearRows)
test.afterEach(clearRows)

async function savedEntry(): Promise<{ mood: number | null; energy: number | null } | null> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data } = await db
    .from('reflections')
    .select('mood, energy')
    .eq('user_id', userId)
    .eq('body', BODY)
  // More than one row would mean autosave duplicated the day.
  expect(data?.length ?? 0).toBeLessThanOrEqual(1)
  return data?.[0] ?? null
}

test('the reflect editor saves itself — text, then mood and energy, on one row', async ({
  page,
}) => {
  const errors = watchConsole(page)
  await signIn(page)
  await page.goto('/reflect')

  const text = page.getByRole('textbox')
  await expect(text).toBeVisible({ timeout: 20_000 })
  await text.fill(BODY)
  await expect.poll(savedEntry, { timeout: 15_000 }).not.toBeNull()

  await page.getByRole('button', { name: /^good$/i }).click()
  // Energy is a battery slider: Home puts it at 1, two steps right land on 3.
  const energy = page.getByRole('slider', { name: /^energy$/i })
  await energy.focus()
  await energy.press('Home')
  await energy.press('ArrowRight')
  await energy.press('ArrowRight')
  await expect(energy).toHaveAttribute('aria-valuenow', '3')
  await expect.poll(savedEntry, { timeout: 15_000 }).toEqual({ mood: 4, energy: 3 })
  await expect(page.getByText(/^saved$/i)).toBeVisible()

  expect(errors).toEqual([])
})
