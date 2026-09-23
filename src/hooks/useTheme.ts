import { useThemeStore, type Theme, type ThemePreference } from '@/stores/theme'

interface UseThemeResult {
  /** The theme on screen — what to branch styling or labels on. */
  theme: Theme
  /** The saved choice, which may be "system". */
  preference: ThemePreference
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

/** Thin selector hook over the theme store for components. */
export function useTheme(): UseThemeResult {
  const theme = useThemeStore((s) => s.resolved)
  const preference = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  return { theme, preference, setTheme, toggleTheme }
}
