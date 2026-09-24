import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui'

/**
 * ⌘K toggles the command palette, ⌘N opens the new-habit form (Ctrl on
 * Windows/Linux). Browsers keep Ctrl+N for a new window; the desktop app and
 * macOS ⌘N reach us.
 */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
      const key = e.key.toLowerCase()
      const ui = useUiStore.getState()
      if (key === 'k') {
        e.preventDefault()
        ui.setPaletteOpen(!ui.paletteOpen)
      } else if (key === 'n') {
        e.preventDefault()
        ui.setPaletteOpen(false)
        ui.openNewHabit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
