import { expect, test, type Page } from '@playwright/test'
import { openDoneSection, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E read 20 pages'

/**
 * Stand-ins for "the account already has habits". The journey below has to
 * hold whether or not these exist, so it runs once as-is and once with them
 * seeded — the shared staging account being empty is a coincidence, not a
 * guarantee, and this spec used to depend on it.
 */
const DECOYS = [
  { name: 'E2E decoy · morning walk', frequency: 'daily' },
  { name: 'E2E decoy · weekly review', frequency: 'weekly' },
] as const

const OWNED_NAMES = [HABIT_NAME, ...DECOYS.map((d) => d.name)]

/**
 * Drop every row this spec creates, before as well as after: a run killed
 * mid-test leaves rows behind, and a second habit under the same name would
 * make the locators ambiguous rather than simply failing.
 */
async function dropOwnedHabits(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { error } = await db.from('habits').delete().eq('user_id', userId).in('name', OWNED_NAMES)
  if (error) throw new Error(`could not clear this spec's habits: ${error.message}`)
}

async function seedDecoys(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { error } = await db
    .from('habits')
    .insert(DECOYS.map((d) => ({ user_id: userId, name: d.name, frequency: d.frequency })))
  if (error) throw new Error(`could not seed decoy habits: ${error.message}`)
}

/** Create a habit through the real form, complete it, reload, still complete. */
async function runHabitJourney(page: Page): Promise<void> {
  const errors = watchConsole(page)
  await signIn(page)

  // Create through "Create" → Habit: the one create path, on any account
  // (there is no separate habits screen any more — habits are Today, S2).
  // The sidebar's «Create» and the toolbar's «+» share the name; either opens the sheet.
  await page.getByRole('button', { name: 'Create', exact: true }).first().click()
  await page
    .getByRole('dialog', { name: 'Create' })
    .getByRole('button', { name: /^habit/i })
    .click()
  const form = page.getByRole('dialog', { name: 'New habit' })
  await form.getByLabel('Habit name').fill(HABIT_NAME)
  await form.getByRole('button', { name: /^create$/i }).click()
  await expect(form).toBeHidden({ timeout: 3_000 })

  // Complete it on the dashboard — that's the one-tap surface the optimistic
  // update exists for.
  await page.goto('/')
  await expect(page.getByRole('link', { name: HABIT_NAME })).toBeVisible()

  const done = page.getByRole('button', {
    name: new RegExp(`^mark ${HABIT_NAME} incomplete$`, 'i'),
  })

  // The toggle is optimistic, so assert the flipped state before the write
  // settles — that instant feedback is the retention-critical part.
  const logWrite = page.waitForResponse(
    (r) => r.url().includes('habit_logs') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: new RegExp(`^complete ${HABIT_NAME}$`, 'i') }).click()
  await expect(done).toBeVisible()
  await logWrite

  await page.reload()
  // Settled into Today's folded "Done" section.
  await openDoneSection(page)
  await expect(done).toBeVisible()

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
}

test.beforeEach(dropOwnedHabits)
test.afterEach(dropOwnedHabits)

test('creates a habit, completes it, and the completion survives a reload', async ({ page }) => {
  await runHabitJourney(page)
})

test('runs the same journey on an account that already has habits', async ({ page }) => {
  await seedDecoys()
  await runHabitJourney(page)
})
