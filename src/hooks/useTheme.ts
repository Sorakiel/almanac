import { useThemeStore, type Theme } from '@/stores/theme'

interface UseThemeResult {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/** Thin selector hook over the theme store for components. */
export function useTheme(): UseThemeResult {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  return { theme, setTheme, toggleTheme }
}
