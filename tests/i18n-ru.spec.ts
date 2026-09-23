import { expect, test, type Page } from '@playwright/test'
import { signIn } from './helpers/app'
import { latinLeaks, readableText, wordsOf } from './helpers/leaks'
import { e2eClient } from './helpers/supabase'

/**
 * Russian is first-class: walk every signed-in route in `ru` and fail on any
 * English word the interface itself printed. What the user typed (habit names,
 * book titles…) is read from the account first and not held against the UI.
 *
 * Read-only: it visits screens and never taps anything that writes.
 */

const OUT = 'screenshots'

const VARIANTS = [
  { name: 'phone-dark', width: 390, height: 844, theme: 'dark' },
  { name: 'desktop-coffee', width: 1440, height: 900, theme: 'coffee' },
] as const

const STATIC_ROUTES = [
  '/',
  '/habits',
  '/flow',
  '/train',
  '/insights',
  '/more',
  '/reflect',
  '/reading',
  '/friends',
  '/achievements',
  '/settings',
]

interface AccountData {
  words: Set<string>
  routes: string[]
}

/** The account's own words, plus one detail route per entity that has rows. */
async function readAccount(): Promise<AccountData> {
  const db = await e2eClient()
  const [
    habits,
    workouts,
    exercises,
    books,
    notes,
    reflections,
    focus,
    subtasks,
    profiles,
    feed,
    quotes,
  ] = await Promise.all([
    db.from('habits').select('id, name, description').is('archived_at', null),
    db.from('workouts').select('id, name'),
    db.from('exercises').select('name, muscle_group'),
    db.from('books').select('id, title, author'),
    db.from('book_notes').select('body'),
    db.from('reflections').select('body'),
    db.from('focus_sessions').select('label'),
    db.from('habit_subtasks').select('title'),
    db.from('profiles').select('display_name'),
    db.from('activity_events').select('subject'),
    // Quotes are content, and still English-only until they carry a Russian text.
    db.from('quotes').select('text, author'),
  ])
  const words = wordsOf([
    ...(habits.data ?? []).flatMap((r) => [r.name, r.description]),
    ...(workouts.data ?? []).map((r) => r.name),
    ...(exercises.data ?? []).flatMap((r) => [r.name, r.muscle_group]),
    ...(books.data ?? []).flatMap((r) => [r.title, r.author]),
    ...(notes.data ?? []).map((r) => r.body),
    ...(reflections.data ?? []).map((r) => r.body),
    ...(focus.data ?? []).map((r) => r.label),
    ...(subtasks.data ?? []).map((r) => r.title),
    ...(profiles.data ?? []).map((r) => r.display_name),
    ...(feed.data ?? []).map((r) => r.subject),
    ...(quotes.data ?? []).flatMap((r) => [r.text, r.author]),
  ])
  const routes = [...STATIC_ROUTES]
  const habit = habits.data?.[0]
  const workout = workouts.data?.[0]
  const book = books.data?.[0]
  if (habit) routes.push(`/habits/${habit.id}`)
  if (workout)
    routes.push(`/train/${workout.id}`, `/train/${workout.id}/edit`, `/train/${workout.id}/session`)
  if (book) routes.push(`/reading/${book.id}`)
  return { words, routes }
}

async function switchToRussian(page: Page, theme: string): Promise<void> {
  await page.evaluate((th) => {
    localStorage.setItem('almanac-theme', JSON.stringify({ state: { theme: th }, version: 0 }))
    localStorage.setItem('almanac-locale', JSON.stringify({ state: { locale: 'ru' }, version: 0 }))
    // Every module on, so each one's screen and nav entry is in the sweep.
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
  }, theme)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
}

for (const v of VARIANTS) {
  test(`no English on Russian screens · ${v.name}`, async ({ page }) => {
    test.setTimeout(180_000)
    const account = await readAccount()
    await page.setViewportSize({ width: v.width, height: v.height })
    await signIn(page)
    await switchToRussian(page, v.theme)

    const leaks: string[] = []
    for (const path of account.routes) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Let entrance cascades and count-ups settle into their final text.
      await page.waitForTimeout(700)
      const words = latinLeaks(await readableText(page), account.words)
      if (words.length > 0) leaks.push(`${path}: ${words.join(', ')}`)
      const slug = path === '/' ? 'dashboard' : path.slice(1).replace(/\//g, '_')
      await page.screenshot({ path: `${OUT}/ru-${v.name}-${slug}.png`, fullPage: true })
    }

    expect(leaks, `English on Russian screens:\n${leaks.join('\n')}`).toEqual([])
  })
}
