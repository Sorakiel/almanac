import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyNativeStatusBar } from '@/lib/statusBar'

export type Theme = 'dark' | 'coffee'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/**
 * Reflect the theme onto <html data-theme> so the CSS token layer swaps, and
 * keep the native Android status/navigation bars in sync (no-op on web).
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  void applyNativeStatusBar(theme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'coffee' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },
    }),
    {
      name: 'almanac-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
