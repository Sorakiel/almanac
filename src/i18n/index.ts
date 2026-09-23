import { en } from '@/i18n/en'
import type { Leaf, PluralForm, TranslationKey, Translations, Vars } from '@/i18n/types'

export type Locale = 'en' | 'ru'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
]

/**
 * English is the source and the fallback, so it ships in the main bundle; every
 * other language is a chunk fetched on demand (`loadLocale`) — nobody reading
 * Russian should download English twice, and nobody reading English Russian.
 */
const DICTIONARIES: Partial<Record<Locale, Translations>> = { en }

const LOADERS: Record<Exclude<Locale, 'en'>, () => Promise<Translations>> = {
  ru: () => import('@/i18n/ru').then((m) => m.ru),
}

/** Make `locale` available to `translate`. Resolves at once when it already is. */
export async function loadLocale(locale: Locale): Promise<void> {
  if (locale === 'en' || DICTIONARIES[locale]) return
  DICTIONARIES[locale] = await LOADERS[locale]()
}

/** The language to start in on a device that has never chosen one. */
export function detectLocale(languages: readonly string[] = navigator.languages ?? []): Locale {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'ru') return 'ru'
    if (base === 'en') return 'en'
  }
  return 'en'
}

function lookup(dict: Translations, key: string): Leaf | undefined {
  let node: unknown = dict
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  if (typeof node === 'string') return node
  return typeof node === 'object' && node !== null ? (node as Leaf) : undefined
}

/**
 * Pick the plural form. Russian has three (one/few/many) and `Intl.PluralRules`
 * knows the rules, so we never hand-roll `n % 10` arithmetic — that is where
 * home-grown pluralisation always goes wrong (11–14 take "many", not "few").
 */
function pluralise(form: Exclude<Leaf, string>, count: number, locale: Locale): string {
  // `select` is typed as every LDML category, including ones neither language
  // uses (zero, two); narrowing here beats widening the dictionary shape.
  const category = new Intl.PluralRules(locale).select(count) as keyof PluralForm
  return form[category] ?? form.other ?? form.one ?? ''
}

function interpolate(template: string, vars: Vars | undefined): string {
  if (vars === undefined) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  )
}

/**
 * Translate one key.
 *
 * Falls back to English rather than to the raw key: a partly translated app is
 * the plan while Russian lands screen by screen, and an English sentence reads
 * better than `settings.exportData`.
 */
export function translate(locale: Locale, key: TranslationKey, vars?: Vars): string {
  const dict = DICTIONARIES[locale]
  const leaf = (dict && lookup(dict, key)) ?? lookup(en, key)
  if (leaf === undefined) return key
  const count = vars?.count
  const template =
    typeof leaf === 'string'
      ? leaf
      : pluralise(leaf, typeof count === 'number' ? count : Number(count ?? 0), locale)
  return interpolate(template, vars)
}
