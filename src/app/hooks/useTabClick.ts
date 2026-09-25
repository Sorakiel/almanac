import type { MouseEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * A tap on the tab or sidebar entry for the screen already open. React Router
 * would still navigate — to the same place, inside a View Transition — and the
 * screen visibly re-entered as if it had reloaded. Instead the tap does what a
 * second tap on a tab does on a phone: back to the top.
 */
export function useTabClick(): (to: string) => (event: MouseEvent<HTMLAnchorElement>) => void {
  const { pathname } = useLocation()

  return (to) => (event) => {
    if (to !== pathname) return
    event.preventDefault()
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    // Desktop scrolls inside <main>; the phone scrolls the page.
    const main = document.querySelector('main')
    if (main && main.scrollHeight > main.clientHeight) main.scrollTo({ top: 0, behavior })
    else window.scrollTo({ top: 0, behavior })
  }
}
