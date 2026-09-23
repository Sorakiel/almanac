import type { Page } from '@playwright/test'

/**
 * Latin words that may legitimately appear on a Russian screen. Keep it short:
 * every entry is a place the test stops looking.
 */
export const LATIN_ALLOWED = new Set([
  // The brand is a name, not a word to translate.
  'almanac',
  // sonner's own region label ("Notifications alt+T"), set in AppToaster.
  'notifications',
])

/** An English word: four or more Latin letters in a row. */
const LATIN_WORD = /[A-Za-z]{4,}/g

/**
 * Everything a Russian reader sees or hears on the page: rendered text plus
 * the accessible names and hints that a screen reader announces.
 */
export async function readableText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts = [document.body.innerText]
    for (const el of document.querySelectorAll('[aria-label],[placeholder],[title],[alt]')) {
      for (const attr of ['aria-label', 'placeholder', 'title', 'alt']) {
        const value = el.getAttribute(attr)
        if (value) parts.push(value)
      }
    }
    return parts.join('\n')
  })
}

/**
 * Latin words in `text` that are neither allowed nor part of the user's own
 * data. Emails and IANA zone ids ("Europe/Moscow") are data too, so they are
 * cut out before looking.
 */
export function latinLeaks(text: string, userWords: ReadonlySet<string>): string[] {
  const cleaned = text.replace(/\S+@\S+/g, ' ').replace(/\b[A-Z][a-z]+\/[A-Za-z_/]+/g, ' ')
  const found = new Set<string>()
  for (const word of cleaned.match(LATIN_WORD) ?? []) {
    const lower = word.toLowerCase()
    if (!LATIN_ALLOWED.has(lower) && !userWords.has(lower)) found.add(word)
  }
  return [...found]
}

/** Lower-cased Latin words across a set of user-supplied strings. */
export function wordsOf(values: Iterable<string | null | undefined>): Set<string> {
  const words = new Set<string>()
  for (const value of values) {
    for (const word of value?.match(LATIN_WORD) ?? []) words.add(word.toLowerCase())
  }
  return words
}
