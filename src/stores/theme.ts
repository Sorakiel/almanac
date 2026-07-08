import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'coffee'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/** Reflect the theme onto <html data-theme> so the CSS token layer swaps. */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
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
