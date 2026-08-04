import { useCallback } from 'react'
import { translate, type Locale } from '@/i18n'
import type { TranslationKey, Vars } from '@/i18n/types'
import { useLocaleStore } from '@/stores/locale'

export type TFunction = (key: TranslationKey, vars?: Vars) => string

interface UseTResult {
  t: TFunction
  locale: Locale
}

/** Translate in a component. Re-renders when the language changes. */
export function useT(): UseTResult {
  const locale = useLocaleStore((s) => s.locale)
  const t = useCallback<TFunction>((key, vars) => translate(locale, key, vars), [locale])
  return { t, locale }
}
