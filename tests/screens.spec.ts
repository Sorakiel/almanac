import { expect, test, type Page } from '@playwright/test'
import { openPalette, signIn, watchConsole } from './helpers/app'
import { e2eClient, e2eUserId } from './helpers/supabase'

/**
 * Visual smoke: walk the main screens at phone and desktop width, in both
 * themes and both languages, and save a screenshot of each. CI uploads the
 * folder, which is how a change to a signed-in screen gets looked at without
 * anyone typing the shared account's password into a browser.
 *
 * The assertions are the cheap, real ones — no console errors, and no page
 * wider than the viewport (the phone-layout regression that screenshots are
 * worst at catching by eye).
 */

const OUT = 'screenshots'

// The project's review standard: every PR with UI is looked at in Russian, at
// phone and desktop width, in both themes — four shots per screen. English is
// covered by every other spec, which all run in it.
const VARIANTS = [
  { name: 'phone-dark-ru', width: 390, height: 844, theme: 'dark', locale: 'ru' },
  { name: 'phone-coffee-ru', width: 390, height: 844, theme: 'coffee', locale: 'ru' },
  // Phase 2 compares against the desktop prototype, which is drawn at 1280×800.
  { name: 'laptop-dark-ru', width: 1280, height: 800, theme: 'dark', locale: 'ru' },
  { name: 'laptop-coffee-ru', width: 1280, height: 800, theme: 'coffee', locale: 'ru' },
  { name: 'desktop-dark-ru', width: 1440, height: 900, theme: 'dark', locale: 'ru' },
  { name: 'desktop-coffee-ru', width: 1440, height: 900, theme: 'coffee', locale: 'ru' },
] as const

const SCREENS = [
  '/',
  '/progress',
  '/flow',
  '/profile',
  '/friends',
  '/more',
  '/more/customize',
] as const

/**
 * A habit with a few months of history, so Insights draws the year strip
 * instead of its empty state. Removed before and after, like every spec's rows.
 */
const SEED_HABIT = 'E2E screens · daily pages'
const SEED_DAYS = 120
// A past journal entry for the Reflect inspector — on a date no real entry has,
// so `unique(user_id, date)` never collides; Cyrillic, so the i18n spec stays quiet.
const SEED_REFLECTION_DATE = '2001-01-02'
const SEED_REFLECTION = 'Тихий день: прогулка, глава книги и ранний отбой.'

async function dropSeed(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { error } = await db.from('habits').delete().eq('user_id', userId).eq('name', SEED_HABIT)
  if (error) throw new Error(`could not clear the screens seed: ${error.message}`)
  const { error: reflectError } = await db
    .from('reflections')
    .delete()
    .eq('user_id', userId)
    .eq('date', SEED_REFLECTION_DATE)
  if (reflectError) throw new Error(`could not clear the screens entry: ${reflectError.message}`)
}

async function seedHistory(): Promise<string> {
  await dropSeed()
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const day = (offset: number) =>
    new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await db
    .from('habits')
    .insert({
      user_id: userId,
      name: SEED_HABIT,
      frequency: 'daily',
      created_at: `${day(SEED_DAYS)}T00:00:00Z`,
    })
    .select('id')
    .single()
  if (error) throw new Error(`could not seed the screens habit: ${error.message}`)
  // Deterministic gaps (every 4th and 7th day missed) so weeks land at different fills.
  const logs = Array.from({ length: SEED_DAYS }, (_, i) => i + 1)
    .filter((i) => i % 4 !== 0 && i % 7 !== 0)
    .map((i) => ({ user_id: userId, habit_id: data.id, date: day(i), count: 1 }))
  const { error: logError } = await db.from('habit_logs').insert(logs)
  if (logError) throw new Error(`could not seed the screens logs: ${logError.message}`)
  const { error: reflectError } = await db.from('reflections').insert({
    user_id: userId,
    date: SEED_REFLECTION_DATE,
    body: SEED_REFLECTION,
    mood: 4,
    energy: 3,
    day_rating: 5,
  })
  if (reflectError) throw new Error(`could not seed the screens entry: ${reflectError.message}`)
  return data.id
}

/**
 * A planned workout for the live-session screen, the prototype's own "Ноги"
 * (`MS.w.today`): squat 5 × 90×5, Romanian deadlift 3 × 70×10, lunges
 * 3 × 20×12 — plus one finished session a week earlier, so "last time" and
 * the record have something to compare with, as in the prototype.
 */
const SESSION_WORKOUT = 'E2E screens · session'
const SESSION_EXERCISES = [
  { name: 'Присед', sets: 5, weight: 90, reps: 5, last: { weight: 87.5, reps: 5 } },
  { name: 'Румынская тяга', sets: 3, weight: 70, reps: 10, last: { weight: 65, reps: 10 } },
  { name: 'Выпады', sets: 3, weight: 20, reps: 12, last: { weight: 20, reps: 12 } },
] as const
const SESSION_TOTAL_SETS = SESSION_EXERCISES.reduce((n, e) => n + e.sets, 0)

async function dropSession(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  // Workout first: its workout_exercises cascade, and they restrict the exercise delete.
  await db.from('workouts').delete().eq('user_id', userId).eq('name', SESSION_WORKOUT)
  await db
    .from('exercises')
    .delete()
    .eq('user_id', userId)
    .in(
      'name',
      SESSION_EXERCISES.map((e) => e.name),
    )
}

async function seedSession(): Promise<string> {
  await dropSession()
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  const { data: workout, error } = await db
    .from('workouts')
    // Daily, so Today shows it in its training card and ring as well.
    .insert({ user_id: userId, name: SESSION_WORKOUT, recurrence: 'daily' })
    .select('id')
    .single()
  if (error) throw new Error(`could not seed the session workout: ${error.message}`)

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { data: past, error: pastError } = await db
    .from('workout_sessions')
    .insert({
      user_id: userId,
      workout_id: workout.id,
      date: weekAgo.toISOString().slice(0, 10),
      started_at: new Date(weekAgo.getTime() - 28 * 60 * 1000).toISOString(),
      completed_at: weekAgo.toISOString(),
    })
    .select('id')
    .single()
  if (pastError) throw new Error(`could not seed the past session: ${pastError.message}`)

  for (const [order, ex] of SESSION_EXERCISES.entries()) {
    const { data: exercise, error: exerciseError } = await db
      .from('exercises')
      .insert({ user_id: userId, name: ex.name })
      .select('id')
      .single()
    if (exerciseError) throw new Error(`could not seed the exercise: ${exerciseError.message}`)
    const { data: link, error: linkError } = await db
      .from('workout_exercises')
      .insert({
        workout_id: workout.id,
        exercise_id: exercise.id,
        target_sets: ex.sets,
        target_reps: ex.reps,
        target_weight: ex.weight,
        sort_order: order,
      })
      .select('id')
      .single()
    if (linkError) throw new Error(`could not attach the exercise: ${linkError.message}`)
    const numbers = Array.from({ length: ex.sets }, (_, k) => k + 1)
    const { error: setsError } = await db.from('set_logs').insert([
      // The plan rows…
      ...numbers.map((n) => ({
        workout_exercise_id: link.id,
        set_number: n,
        reps: ex.reps,
        weight: ex.weight,
        rest_seconds: 90,
        // Spelled out: a bulk insert with mixed keys sends null, not the default.
        done: false,
        session_id: null,
      })),
      // …and what was lifted a week ago.
      ...numbers.map((n) => ({
        workout_exercise_id: link.id,
        set_number: n,
        reps: ex.last.reps,
        weight: ex.last.weight,
        rest_seconds: 90,
        done: true,
        session_id: past.id,
      })),
    ])
    if (setsError) throw new Error(`could not seed the sets: ${setsError.message}`)
  }
  return workout.id
}

/**
 * A representative day for Today: habits in each time-of-day group (one
 * already ticked, so "Done" has a row, one counted up to a daily amount and
 * part way there), a book in progress and a finished
 * focus block — so the rings and module cards are drawn with content rather
 * than hidden. The workout comes from `seedSession`, which recurs daily.
 */
const TODAY_HABITS = [
  { name: 'E2E screens · утро вода', time_of_day: 'morning', done: true },
  { name: 'E2E screens · стаканы', time_of_day: 'morning', done: false, goal: 8, count: 3 },
  { name: 'E2E screens · английский', time_of_day: 'afternoon', done: false },
  { name: 'E2E screens · читать', time_of_day: 'evening', done: false },
  { name: 'E2E screens · уборка', time_of_day: 'anytime', frequency: 'weekly', done: false },
] as const
const TODAY_BOOK = 'E2E screens · книга'
const TODAY_FOCUS = 'E2E screens · фокус'

async function dropToday(): Promise<void> {
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  await db
    .from('habits')
    .delete()
    .eq('user_id', userId)
    .in(
      'name',
      TODAY_HABITS.map((h) => h.name),
    )
  await db.from('books').delete().eq('user_id', userId).eq('title', TODAY_BOOK)
  await db.from('focus_sessions').delete().eq('user_id', userId).eq('label', TODAY_FOCUS)
}

async function seedToday(): Promise<void> {
  await dropToday()
  const db = await e2eClient()
  const userId = await e2eUserId(db)
  // "Today" is the profile's local day, not UTC's — seeded on the runner's UTC
  // date near midnight, the tick and the focus block landed on yesterday.
  const { data: profile } = await db.from('profiles').select('timezone').eq('id', userId).single()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: profile?.timezone ?? 'UTC' }).format(
    new Date(),
  )
  const { data: habits, error } = await db
    .from('habits')
    .insert(
      TODAY_HABITS.map((h, i) => ({
        user_id: userId,
        name: h.name,
        time_of_day: h.time_of_day,
        frequency: 'frequency' in h ? h.frequency : 'daily',
        // Every row names every column: in a bulk insert PostgREST fills a key
        // missing from one row with null, not with the column default.
        daily_goal: 'goal' in h ? h.goal : 1,
        unit: 'goal' in h ? 'glasses' : null,
        sort_order: 100 + i,
      })),
    )
    .select('id, name')
  if (error) throw new Error(`could not seed Today's habits: ${error.message}`)
  const logged = habits.flatMap((h) => {
    const seed = TODAY_HABITS.find((t) => t.name === h.name)
    const count = seed && 'count' in seed ? seed.count : seed?.done ? 1 : 0
    return count > 0 ? [{ user_id: userId, habit_id: h.id, date: today, count }] : []
  })
  const { error: logError } = await db.from('habit_logs').insert(logged)
  if (logError) throw new Error(`could not tick Today's habit: ${logError.message}`)
  const { error: bookError } = await db.from('books').insert({
    user_id: userId,
    title: TODAY_BOOK,
    status: 'reading',
    progress_mode: 'pages',
    current_unit: 212,
    total_units: 320,
    daily_goal: 15,
  })
  if (bookError) throw new Error(`could not seed the book: ${bookError.message}`)
  const { error: focusError } = await db
    .from('focus_sessions')
    .insert({ user_id: userId, date: today, minutes: 25, label: TODAY_FOCUS })
  if (focusError) throw new Error(`could not seed the focus block: ${focusError.message}`)
}

let sessionId = ''
let habitId = ''

test.beforeEach(async () => {
  habitId = await seedHistory()
  sessionId = await seedSession()
  await seedToday()
})
test.afterEach(async () => {
  await dropSeed()
  await dropSession()
  await dropToday()
})

async function applyPrefs(page: Page, theme: string, locale: string): Promise<void> {
  await page.evaluate(
    ([th, lo]) => {
      localStorage.setItem('almanac-theme', JSON.stringify({ state: { theme: th }, version: 0 }))
      localStorage.setItem('almanac-locale', JSON.stringify({ state: { locale: lo }, version: 0 }))
      // Every module on, so Today draws all of its module cards.
      localStorage.setItem(
        'almanac.modules',
        JSON.stringify({
          state: {
            enabled: {
              habits: true,
              insights: true,
              workouts: true,
              flow: true,
              reflect: true,
              reading: true,
              social: true,
            },
          },
          version: 0,
        }),
      )
    },
    [theme, locale],
  )
  await page.reload()
}

async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow, `${label} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1)
}

async function shoot(page: Page, file: string, fullPage = true): Promise<void> {
  // Let entrance cascades settle so the capture shows the resting layout.
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage })
}

for (const v of VARIANTS) {
  test(`screens · ${v.name}`, async ({ page }) => {
    // The session walk ticks the whole plan through to the medal.
    test.setTimeout(180_000)
    const errors = watchConsole(page)
    await page.setViewportSize({ width: v.width, height: v.height })
    await signIn(page)
    await applyPrefs(page, v.theme, v.locale)
    await expect(page.locator('html')).toHaveAttribute('data-theme', v.theme)
    await expect(page.locator('html')).toHaveAttribute('lang', v.locale)

    // Progress has loaded its data once the habits card (seeded above) is drawn.
    await page.goto('/progress')
    await expect(
      page.getByRole('region', { name: v.locale === 'ru' ? 'Привычки' : 'Habits' }),
    ).toBeVisible()

    for (const path of SCREENS) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const slug = path === '/' ? 'dashboard' : path.slice(1).replaceAll('/', '-')
      await expectNoHorizontalScroll(page, `${v.name} ${path}`)
      await shoot(page, `${v.name}-${slug}`)
      // What the first screen really looks like: a full-page capture pins the
      // fixed tab bar mid-page, which reads as an overlap that is not there.
      if (path === '/') await shoot(page, `${v.name}-${slug}-fold`, false)
    }

    // Progress with the habits card open — on the phone the year strip lives
    // inside it; the desktop card has none (desktop-prototype.html).
    await page.goto('/progress')
    const habits = page.getByRole('region', { name: v.locale === 'ru' ? 'Привычки' : 'Habits' })
    await expect(habits).toBeVisible()
    // The phone opens details on tap; the desktop shows them without a button.
    const disclose = habits.getByRole('button', { expanded: false })
    const phone = await disclose.isVisible()
    if (phone) await disclose.click()
    const year = habits.getByRole('group', { name: /2\d{3}/ })
    if (phone) await expect(year).toBeVisible()
    else await expect(year).toBeHidden()
    await shoot(page, `${v.name}-insights-open`)

    // The focus card is one line (desktop prototype): the best time and the typical session.
    const focus = page.getByRole('region', { name: v.locale === 'ru' ? 'Фокус' : 'Flow' })
    const focusDisclose = focus.getByRole('button', { expanded: false })
    if (await focusDisclose.isVisible()) await focusDisclose.click()
    await focus.scrollIntoViewIfNeeded()
    await expect(
      focus.getByText(v.locale === 'ru' ? /средняя сессия/i : /average session/i),
    ).toBeVisible()
    await page.waitForTimeout(700)
    await focus.screenshot({ path: `${OUT}/${v.name}-progress-focus.png` })

    // The custom-length stepper only exists once "custom" is picked.
    await page.goto('/flow')
    await page.getByRole('radio', { name: v.locale === 'ru' ? 'Своя' : 'Custom' }).click()
    await expect(
      page.getByRole('spinbutton', {
        name: v.locale === 'ru' ? 'Своя длительность в минутах' : 'Custom length in minutes',
      }),
    ).toBeVisible()
    await shoot(page, `${v.name}-flow-custom`)

    // Password sheet: opened only, never submitted — the shared account's password stays put.
    await page.goto('/profile')
    await page.getByRole('button', { name: v.locale === 'ru' ? /Пароль/ : /Password/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await shoot(page, `${v.name}-profile-password`)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    // Edit profile: opened only, never saved — the shared account's name stays put.
    await page
      .getByRole('button', { name: v.locale === 'ru' ? 'Изменить профиль' : 'Edit profile' })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await shoot(page, `${v.name}-profile-edit`, false)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    // Create sheet: the grid, then the quick habit form. Viewport-only — a
    // full-page capture stretches a sheet sized to the viewport.
    const create = v.locale === 'ru' ? 'Создать' : 'Create'
    // Desktop has two: the sidebar's and the toolbar "+"; both open the same sheet.
    await page.getByRole('button', { name: create, exact: true }).first().click()
    const sheet = page.getByRole('dialog', { name: create })
    await expect(sheet).toBeVisible()
    await shoot(page, `${v.name}-create`, false)
    await sheet.getByRole('button', { name: v.locale === 'ru' ? /^Привычка/ : /^Habit/ }).click()
    await expect(
      page.getByRole('dialog', { name: v.locale === 'ru' ? 'Новая привычка' : 'New habit' }),
    ).toBeVisible()
    await shoot(page, `${v.name}-create-habit`, false)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    // Habit detail: month calendar, then the year, then the red action sheet.
    await page.goto(`/habits/${habitId}`)
    await expect(page.getByRole('heading', { name: SEED_HABIT })).toBeVisible({ timeout: 20_000 })
    await expectNoHorizontalScroll(page, `${v.name} habit detail`)
    await shoot(page, `${v.name}-habit-detail`)
    await page.getByRole('radio', { name: v.locale === 'ru' ? 'Год' : 'Year' }).click()
    await shoot(page, `${v.name}-habit-detail-year`)
    await page
      .getByRole('button', { name: v.locale === 'ru' ? 'Удалить навсегда' : 'Delete forever' })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await shoot(page, `${v.name}-habit-delete-sheet`, false)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    // ⌘K palette — desktop only; the phone has no keyboard shortcut to show.
    if (v.width >= 1024) {
      await page.goto('/')
      await openPalette(page)
      await shoot(page, `${v.name}-palette`, false)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()

      // Habits live on Today: a row opens the habit panel in place, no page change.
      await page.goto('/')
      // An undone one, so its row is in the open list rather than folded into "Done".
      const openHabit = TODAY_HABITS[2].name
      await page.getByRole('link', { name: openHabit }).click()
      const inspector = page.getByRole('complementary', {
        name: v.locale === 'ru' ? 'Привычка' : 'Habit',
      })
      await expect(inspector.getByRole('heading', { name: openHabit })).toBeVisible({
        timeout: 20_000,
      })
      await expect(page).toHaveURL(/\/$/)
      await page.waitForTimeout(600) // the slide-in
      await shoot(page, `${v.name}-habits-inspector`, false)
      await page.keyboard.press('Escape')
      await expect(inspector).toBeHidden()

      // Modules → Customize carries the habits' order now.
      await page.goto('/more/customize')
      await expect(
        page.getByRole('heading', { name: v.locale === 'ru' ? 'Порядок привычек' : 'Habit order' }),
      ).toBeVisible()

      // Reflect: two columns (composer, history | mood month, quote); an entry opens in place.
      await page.goto('/reflect')
      const entry = page.getByRole('button', { name: new RegExp(SEED_REFLECTION.slice(0, 10)) })
      await expect(entry).toBeVisible({ timeout: 20_000 })
      await shoot(page, `${v.name}-reflect`)
      await entry.click()
      await expect(entry).toHaveAttribute('aria-expanded', 'true')
      await shoot(page, `${v.name}-reflect-entry`, false)

      // Reading: two columns (reading now, finished | up next); a book opens as a page.
      await page.goto('/reading')
      const bookCard = page.getByRole('link', { name: new RegExp(TODAY_BOOK) })
      await expect(bookCard).toBeVisible({ timeout: 20_000 })
      await shoot(page, `${v.name}-reading`)
      await bookCard.click()
      await expect(page.getByRole('heading', { name: TODAY_BOOK })).toBeVisible({
        timeout: 20_000,
      })
      await shoot(page, `${v.name}-reading-book`)

      // Training: two columns (week, today, history | plan); a workout opens as a page.
      await page.goto('/train')
      const plan = page.getByRole('complementary', { name: v.locale === 'ru' ? 'План' : 'Plan' })
      const workoutRow = plan.getByRole('button', { name: new RegExp(`^${SESSION_WORKOUT}`) })
      await expect(workoutRow).toBeVisible({ timeout: 20_000 })
      await shoot(page, `${v.name}-train`)
      await workoutRow.click()
      await expect(page.getByRole('heading', { name: SESSION_WORKOUT })).toBeVisible({
        timeout: 20_000,
      })
      await shoot(page, `${v.name}-train-workout`)
    }

    // Live session, one set at a time: work, rest, the sets list, finished.
    await page.goto(`/train/${sessionId}/session`)
    const setDone = page.getByRole('button', {
      name: v.locale === 'ru' ? 'Подход сделан' : 'Set done',
    })
    await expect(setDone).toBeVisible({ timeout: 20_000 })
    // "Last time" comes from the session history, a query of its own: wait
    // for it, or the first variant catches the line mid-entrance, invisible.
    await expect(
      page.getByText(v.locale === 'ru' ? 'В прошлый раз 87,5 × 5' : 'Last time 87.5 × 5'),
    ).toBeVisible({ timeout: 20_000 })
    await expectNoHorizontalScroll(page, `${v.name} session`)
    await shoot(page, `${v.name}-session`, false)
    await setDone.click()
    const ready = page.getByRole('button', { name: v.locale === 'ru' ? 'Я готов' : 'I’m ready' })
    await expect(ready).toBeVisible()
    // "Next" names the set that is actually next — the second, not the third.
    await expect(
      page.getByText(v.locale === 'ru' ? 'Присед · подход 2' : 'Присед · set 2'),
    ).toBeVisible()
    await page.waitForTimeout(1200) // the water settles to its level
    await shoot(page, `${v.name}-session-rest`, false)
    const allSets = page.getByRole('button', {
      name: v.locale === 'ru' ? 'Все подходы' : 'All sets',
    })
    if (await allSets.isVisible()) await allSets.click()
    await shoot(page, `${v.name}-session-sets`)
    // Through the rest of the plan to the medal.
    for (let n = 1; n < SESSION_TOTAL_SETS; n++) {
      await ready.click()
      await setDone.click()
    }
    await expect(
      page.getByText(v.locale === 'ru' ? 'Тренировка закрыта' : 'Workout closed'),
    ).toBeVisible()
    await page.waitForTimeout(1400) // the medal lands, the check draws
    await shoot(page, `${v.name}-session-done`, false)

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
  })
}

/**
 * Today at the prototype's own desktop size (desktop-prototype.html is drawn at
 * 1280×800), for the side-by-side check — folded, then with "Done" open.
 */
for (const theme of ['dark', 'coffee'] as const) {
  test(`screens · today-1280-${theme}-ru`, async ({ page }) => {
    const errors = watchConsole(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await signIn(page)
    await applyPrefs(page, theme, 'ru')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { level: 1, name: 'Сегодня' })).toBeVisible()
    await expectNoHorizontalScroll(page, `today 1280 ${theme}`)
    await shoot(page, `desktop1280-${theme}-ru-dashboard`, false)
    const done = page.getByRole('button', { name: /^Готово/ })
    if (await done.count()) {
      await done.click()
      await shoot(page, `desktop1280-${theme}-ru-dashboard-done`, false)
    }
    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
  })
}
