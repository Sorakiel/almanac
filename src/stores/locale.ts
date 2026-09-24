import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectLocale, loadLocale, type Locale } from '@/i18n'

interface LocaleState {
  locale: Locale
  /** True once someone picked a language on this device, not just inherited one. */
  chosen: boolean
  /** An explicit choice: it also becomes the account's language on other devices. */
  setLocale: (locale: Locale) => void
  /** Take the account's language without counting it as this device's own choice. */
  adoptLocale: (locale: Locale) => void
}

/** Keep `<html lang>` honest — screen readers pick pronunciation from it. */
function applyLocale(locale: Locale): void {
  document.documentElement.setAttribute('lang', locale)
}

/**
 * Interface language. Kept on the device so it applies before any network
 * round-trip, and synced through `user_settings` so a new phone opens in the
 * language already picked on the laptop.
 *
 * A device that has never chosen starts in the browser's language (Russian or
 * English, English otherwise) until the account's language arrives. An explicit
 * choice is written to the account; the newest one wins on every device.
 *
 * The dictionary is a lazy chunk: `setLocale` loads it first, so the screen
 * never re-renders half in the old language. The stored locale is loaded
 * before the first render in main.tsx.
 */
/** Load the dictionary first, so the screen never re-renders half in the old language. */
function switchTo(locale: Locale, commit: () => void): void {
  // A failed chunk load (offline, never cached) still switches: missing keys
  // fall back to English rather than the tap doing nothing.
  void loadLocale(locale)
    .catch(() => undefined)
    .then(() => {
      applyLocale(locale)
      commit()
    })
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: typeof navigator === 'undefined' ? 'en' : detectLocale(),
      chosen: false,
      setLocale: (locale) => switchTo(locale, () => set({ locale, chosen: true })),
      adoptLocale: (locale) => switchTo(locale, () => set({ locale })),
    }),
    {
      name: 'almanac-locale',
      partialize: (state) => ({ locale: state.locale, chosen: state.chosen }),
      // Persist writes only on a change, so a locale saved by an older build
      // was necessarily picked by hand.
      merge: (persisted, current) => {
        const saved = persisted as Partial<LocaleState> | undefined
        return {
          ...current,
          ...(saved?.locale ? { locale: saved.locale } : {}),
          chosen: saved?.chosen ?? saved?.locale !== undefined,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state) applyLocale(state.locale)
      },
    },
  ),
)
