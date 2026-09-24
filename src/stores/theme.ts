import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyNativeStatusBar } from '@/lib/platform/statusBar'
import { themeViewTransition } from '@/lib/viewTransition'

/** A theme the page can actually be painted in. */
export type Theme = 'dark' | 'coffee'
/** What the user picked — "system" follows the OS light/dark setting. */
export type ThemePreference = Theme | 'system'

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

/** The theme a preference paints right now. Mirrored by the inline script in index.html. */
export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== 'system') return preference
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia(SYSTEM_DARK).matches ? 'dark' : 'coffee'
}

interface ThemeState {
  /** The saved choice. Kept under the old field name so existing saved themes still load. */
  theme: ThemePreference
  /** What is painted: the choice, or the OS setting when the choice is "system". */
  resolved: Theme
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
  /** Take a choice made on another device — painted at once, no wipe animation. */
  adoptTheme: (theme: ThemePreference) => void
}

/** Canvas colour per theme, mirroring `--color-bg` in the token layer. */
const CHROME_COLOR: Record<Theme, string> = { dark: '#1B1B1D', coffee: '#F2EADB' }

/**
 * Reflect the theme onto <html data-theme> so the CSS token layer swaps, keep
 * the native Android status/navigation bars in sync (no-op on web), and match
 * the browser chrome. The last one only shows up once Almanac is installed to a
 * home screen, where the chrome is the only frame around the app — a dark strip
 * above the coffee canvas reads as a rendering bug.
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME_COLOR[theme])
  void applyNativeStatusBar(theme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolved: 'dark',
      setTheme: (theme) => {
        const resolved = resolveTheme(theme)
        // data-theme is an attribute swap, so the new theme paints synchronously
        // inside the transition callback — the captured "new" snapshot is correct
        // without waiting on React to re-render.
        themeViewTransition(() => {
          applyTheme(resolved)
          set({ theme, resolved })
        })
      },
      adoptTheme: (theme) => {
        const resolved = resolveTheme(theme)
        applyTheme(resolved)
        set({ theme, resolved })
      },
      // A toggle is an explicit choice: it flips what is on screen and stops
      // following the system.
      toggleTheme: () => {
        const next: Theme = get().resolved === 'dark' ? 'coffee' : 'dark'
        themeViewTransition(() => {
          applyTheme(next)
          set({ theme: next, resolved: next })
        })
      },
    }),
    {
      name: 'almanac-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const resolved = resolveTheme(state.theme)
        state.resolved = resolved
        applyTheme(resolved)
      },
    },
  ),
)

// "Like the system" has to keep following it: the OS flips to dark at sunset
// while the app is open.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia(SYSTEM_DARK).addEventListener('change', () => {
    const { theme, resolved } = useThemeStore.getState()
    if (theme !== 'system') return
    const next = resolveTheme('system')
    if (next === resolved) return
    themeViewTransition(() => {
      applyTheme(next)
      useThemeStore.setState({ resolved: next })
    })
  })
}
