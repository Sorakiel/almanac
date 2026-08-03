import { expect, test, type Page } from '@playwright/test'
import { signIn, watchConsole } from './helpers/app'
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

  // Create from /habits, not the dashboard. The dashboard only offers an
  // "Add habit" button inside its empty state — with any habit present it
  // shows "Capture" instead — whereas the habits page keeps its create
  // affordance in the header either way.
  await page.goto('/habits')
  await page
    .getByRole('button', { name: /new habit|add habit/i })
    .first()
    .click()
  await page.getByLabel('Name').fill(HABIT_NAME)
  await page.getByRole('button', { name: /create habit/i }).click()

  // Habit cards on /habits are buttons ("Open <name>"); on the dashboard the
  // same habit is a link. Assert each in its own vocabulary rather than
  // porting one locator across.
  await expect(page.getByRole('button', { name: `Open ${HABIT_NAME}` })).toBeVisible()

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
