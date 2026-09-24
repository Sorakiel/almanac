import { expect, test, type Page } from '@playwright/test'
import { recordOfflineShell, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

const HABIT_NAME = 'E2E offline tap'
const OFFLINE_CREATED = 'E2E offline create'

const completeButton = (page: Page) =>
  page.getByRole('button', { name: new RegExp(`^complete ${HABIT_NAME}$`, 'i') })
const doneButton = (page: Page) =>
  page.getByRole('button', { name: new RegExp(`mark ${HABIT_NAME} incomplete`, 'i') })

async function dropHabit(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { error } = await db
    .from('habits')
    .delete()
    .eq('user_id', userId)
    .in('name', [HABIT_NAME, OFFLINE_CREATED])
  if (error) throw new Error(`could not clear this spec's habit: ${error.message}`)
}

// Before as well as after: a run killed mid-test leaves the row behind, and a
// second habit under the same name makes every locator here ambiguous.
test.beforeEach(dropHabit)
test.afterEach(dropHabit)

async function createHabit(page: Page, name = HABIT_NAME): Promise<void> {
  await page
    .getByRole('button', { name: /add habit/i })
    .first()
    .click()
  await page.getByLabel('Name').fill(name)
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^create$/i })
    .click()
  // The sheet closes on the tap itself — it must never wait on the network.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 })
  await expect(page.getByRole('link', { name })).toBeVisible()
}

/** Confirm the tap actually persisted, not just that a request fired. */
async function expectLoggedOnServer(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data: habit } = await db
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('name', HABIT_NAME)
    .single()
  const { data: log } = await db
    .from('habit_logs')
    .select('count')
    .eq('habit_id', habit?.id ?? '')
    .single()
  expect(log?.count).toBe(1)
}

const logWrite = (page: Page) =>
  page.waitForResponse((r) => r.url().includes('habit_logs') && r.request().method() === 'POST', {
    timeout: 15_000,
  })

// Forcing the browser offline necessarily fails any in-flight resource load,
// and Vite's dev-only HMR socket to localhost with it — expected noise from
// the test setup, not the app.
function expectNoRealErrors(errors: string[]): void {
  const real = errors.filter(
    (e) =>
      !e.includes('ERR_INTERNET_DISCONNECTED') &&
      !e.includes("WebSocket connection to 'ws://localhost"),
  )
  expect(real, `console errors:\n${real.join('\n')}`).toEqual([])
}

test('a habit tapped offline lands on the server once the connection returns', async ({
  page,
  context,
}) => {
  const errors = watchConsole(page)
  await signIn(page)
  await createHabit(page)

  await context.setOffline(true)

  // The tap must still land instantly (optimistic) with no network available.
  await completeButton(page).click()
  await expect(doneButton(page)).toBeVisible()

  // And the capsule tells the truth: the change is kept, not lost.
  const capsule = page.getByRole('status').filter({ hasText: /offline|sending|saved/i })
  await expect(capsule).toHaveText('Offline · 1 change waiting')
  await expect(page.getByTitle('Waiting to sync')).toHaveCount(1)

  // Give the mutation a moment to actually reach paused state before
  // reconnecting — otherwise this races the retryer's own pause.
  await page.waitForTimeout(300)

  const write = logWrite(page)
  await context.setOffline(false)
  await write
  await expect(capsule).toHaveText('All saved')
  await expect(page.getByTitle('Waiting to sync')).toHaveCount(0)

  await expectLoggedOnServer()
  expectNoRealErrors(errors)
})

test('a tap survives the app being reloaded while still offline', async ({ page, context }) => {
  const errors = watchConsole(page)
  const shell = await recordOfflineShell(context)
  await signIn(page)
  await createHabit(page)

  await shell.offline()
  await completeButton(page).click()
  await expect(doneButton(page)).toBeVisible()

  // Reload straight away — inside the persister's 2 s throttle, the case that
  // used to lose the tap before it ever reached storage.
  await page.reload()
  await expect(doneButton(page)).toBeVisible({ timeout: 20_000 })

  const write = logWrite(page)
  await shell.online()
  await write

  await expectLoggedOnServer()
  expectNoRealErrors(errors)
})

test('a tap made after an offline cold start is kept, then synced', async ({ page, context }) => {
  const errors = watchConsole(page)
  const shell = await recordOfflineShell(context)
  await signIn(page)
  await createHabit(page)

  await shell.offline()
  await page.reload()
  await completeButton(page).click({ timeout: 20_000 })
  await expect(doneButton(page)).toBeVisible()

  // Long enough for a doomed request to fail and roll the tick back.
  await page.waitForTimeout(3_000)
  await expect(doneButton(page)).toBeVisible()

  const write = logWrite(page)
  await shell.online()
  await write

  await expectLoggedOnServer()
  expectNoRealErrors(errors)
})

test('a habit created and ticked offline lands, in order, after a reload', async ({
  page,
  context,
}) => {
  const errors = watchConsole(page)
  const shell = await recordOfflineShell(context)
  await signIn(page)
  // The dashboard must have loaded before the network goes: offline, a query
  // that never finished just pauses and the page has nothing to offer.
  await expect(page.getByRole('button', { name: /add habit/i }).first()).toBeVisible()

  await shell.offline()
  await createHabit(page, OFFLINE_CREATED)
  await page.getByRole('button', { name: new RegExp(`^complete ${OFFLINE_CREATED}$`, 'i') }).click()

  // Both writes are queued behind each other; the reload must keep both, and
  // the tick must not reach the server before the habit it belongs to.
  await page.reload()
  const done = page.getByRole('button', {
    name: new RegExp(`mark ${OFFLINE_CREATED} incomplete`, 'i'),
  })
  await expect(done).toBeVisible({ timeout: 20_000 })

  const write = logWrite(page)
  await shell.online()
  await write

  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data: habit } = await db
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('name', OFFLINE_CREATED)
    .single()
  const { data: log } = await db
    .from('habit_logs')
    .select('count')
    .eq('habit_id', habit?.id ?? '')
    .single()
  expect(log?.count).toBe(1)
  expectNoRealErrors(errors)
})
