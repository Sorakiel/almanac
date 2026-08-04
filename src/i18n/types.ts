import type { en } from '@/i18n/en'

/** The plural categories Russian actually uses. English uses one/other. */
export type PluralCategory = 'one' | 'few' | 'many' | 'other'

export type PluralForm = Partial<Record<PluralCategory, string>>

export type Leaf = string | PluralForm

/**
 * A plural set is an object whose keys are *only* plural categories. Testing
 * `extends PluralForm` is not enough: every property there is optional, so any
 * object structurally satisfies it — including `{ label, description }`, which
 * would then be mistaken for a leaf and hide `modules.habits.label` from the
 * key union. Checking the keys is the part that actually discriminates.
 */
type IsPlural<T> = [keyof T] extends [PluralCategory] ? true : false

/** Every dotted path in the dictionary that ends at a translatable leaf. */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : IsPlural<T[K]> extends true
      ? K
      : `${K}.${Paths<T[K]>}`
}[keyof T & string]

export type TranslationKey = Paths<typeof en>

type Mirror<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : IsPlural<T[K]> extends true
      ? PluralForm
      : Mirror<T[K]>
}

/**
 * A translation shaped exactly like the English source. Every leaf is required,
 * so an untranslated key fails the build instead of rendering blank — the whole
 * point of typing this rather than reaching for a runtime i18n library.
 */
export type Translations = Mirror<typeof en>

export type Vars = Record<string, string | number>
