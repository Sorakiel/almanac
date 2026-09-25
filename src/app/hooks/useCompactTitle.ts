import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** How far below the top edge the large title counts as gone: the bar it hides under. */
const PHONE_BAR_PX = 44
const DESKTOP_TOOLBAR_PX = 60

function barHeight(): number {
  return window.matchMedia('(min-width: 1024px)').matches ? DESKTOP_TOOLBAR_PX : PHONE_BAR_PX
}

interface CompactTitle {
  /** The screen's own title, read from its `<h1>`; null on a screen without one. */
  title: string | null
  /** The large title has scrolled up under the bar. */
  compact: boolean
}

/**
 * Watch the current screen's large title and report when it has scrolled away
 * (motion spec, `.p-compact`): the shell then shows the same words in a
 * compact bar. One watcher for every screen, keyed to whatever `<h1>` the
 * screen renders — a screen needs nothing of its own to get the behaviour.
 *
 * The title element can arrive late (a screen showing its skeleton first) or
 * be replaced, so the watcher re-finds it whenever `<main>` changes.
 */
export function useCompactTitle(ready: boolean): CompactTitle {
  const { pathname } = useLocation()
  const [state, setState] = useState<CompactTitle>({ title: null, compact: false })

  useEffect(() => {
    if (!ready) return
    const main = document.querySelector('main')
    if (!main) return
    let current: Element | null = null
    let io: IntersectionObserver | null = null

    const attach = () => {
      const h1 = main.querySelector('h1')
      if (h1 === current) return
      current = h1
      io?.disconnect()
      if (!h1) {
        setState({ title: null, compact: false })
        return
      }
      const bar = barHeight()
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return
          const top = entry.rootBounds?.top ?? bar
          setState({
            title: h1.textContent?.trim() || null,
            compact: !entry.isIntersecting && entry.boundingClientRect.bottom <= top,
          })
        },
        { rootMargin: `-${bar}px 0px 0px 0px` },
      )
      io.observe(h1)
    }

    attach()
    const mo = new MutationObserver(attach)
    mo.observe(main, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io?.disconnect()
    }
  }, [pathname, ready])

  return state
}
