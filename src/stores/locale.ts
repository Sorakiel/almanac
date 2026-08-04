import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '@/i18n'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/** Keep `<html lang>` honest — screen readers pick pronunciation from it. */
function applyLocale(locale: Locale): void {
  document.documentElement.setAttribute('lang', locale)
}

/**
 * Interface language. Device-local rather than on the profile: it is a property
 * of where you are reading, not of who you are, and it must apply before any
 * network round-trip.
 *
 * The default stays **English** even for a Russian browser. Russian is landing
 * screen by screen, and auto-detecting would hand every existing user a
 * half-translated interface without asking. The default flips once coverage is
 * complete.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => {
        applyLocale(locale)
        set({ locale })
      },
    }),
    {
      name: 'almanac-locale',
      onRehydrateStorage: () => (state) => {
        if (state) applyLocale(state.locale)
      },
    },
  ),
)
