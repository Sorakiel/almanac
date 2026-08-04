import { en } from '@/i18n/en'
import { ru } from '@/i18n/ru'
import type { Leaf, PluralForm, TranslationKey, Translations, Vars } from '@/i18n/types'

export type Locale = 'en' | 'ru'

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
]

const DICTIONARIES: Record<Locale, Translations> = { en, ru }

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
  const leaf = lookup(DICTIONARIES[locale], key) ?? lookup(en, key)
  if (leaf === undefined) return key
  const count = vars?.count
  const template =
    typeof leaf === 'string'
      ? leaf
      : pluralise(leaf, typeof count === 'number' ? count : Number(count ?? 0), locale)
  return interpolate(template, vars)
}
