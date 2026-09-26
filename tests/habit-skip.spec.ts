import { expect, test } from '@playwright/test'
import { openDoneSection, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E skipped habit'

test.use({ viewport: { width: 390, height: 844 } })

async function clearRows(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db.from('habits').delete().eq('user_id', userId).eq('name', HABIT_NAME)
}

test.beforeEach(clearRows)
test.afterEach(clearRows)

async function freezeCount(habitId: string): Promise<number> {
  const db = await e2eClient()
  const { data } = await db.from('habit_freezes').select('id').eq('habit_id', habitId)
  return data?.length ?? 0
}

test('holding the check skips today on purpose, and a right-click takes it back', async ({
  page,
}) => {
  const errors = watchConsole(page)
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data, error } = await db
    .from('habits')
    .insert({ user_id: userId, name: HABIT_NAME, frequency: 'daily', time_of_day: 'anytime' })
    .select('id')
    .single()
  if (error) throw error
  const id = data.id
  await signIn(page)

  const check = page.getByRole('button', { name: `Complete ${HABIT_NAME}` })
  await expect(check).toBeVisible({ timeout: 20_000 })
  const box = await check.boundingBox()
  if (!box) throw new Error('the check has no box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()

  // Skipped: out of the open list, not ticked, and saved as a protected day.
  await expect(page.getByText(`“${HABIT_NAME}” skipped on purpose`)).toBeVisible()
  await expect.poll(() => freezeCount(id), { timeout: 15_000 }).toBe(1)

  await openDoneSection(page)
  const row = page.locator('.today-row', { hasText: HABIT_NAME })
  await expect(row.getByText('Skipped on purpose', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: `Complete ${HABIT_NAME}` }).click({ button: 'right' })
  await expect.poll(() => freezeCount(id), { timeout: 15_000 }).toBe(0)
  expect(errors).toEqual([])
})
