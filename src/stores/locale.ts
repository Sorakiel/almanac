import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectLocale, loadLocale, type Locale } from '@/i18n'

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
 * A device that has never chosen starts in the browser's language (Russian or
 * English, English otherwise). A saved choice always wins, so this never
 * switches anyone who already picked.
 *
 * The dictionary is a lazy chunk: `setLocale` loads it first, so the screen
 * never re-renders half in the old language. The stored locale is loaded
 * before the first render in main.tsx.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: typeof navigator === 'undefined' ? 'en' : detectLocale(),
      setLocale: (locale) => {
        // A failed chunk load (offline, never cached) still switches: missing
        // keys fall back to English rather than the tap doing nothing.
        void loadLocale(locale)
          .catch(() => undefined)
          .then(() => {
            applyLocale(locale)
            set({ locale })
          })
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
