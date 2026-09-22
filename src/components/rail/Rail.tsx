import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * The desktop context rail ("The Almanac watches your day") is shell-level
 * chrome flush to the right edge, but its contents are page-specific. Pages
 * render `<Rail>…</Rail>` and it portals into the shell's rail column.
 *
 * The rail column is present in the DOM at every width (hidden below `lg`), so
 * on mobile the portaled content simply isn't shown — pages render their own
 * inline equivalents there instead.
 */
const RailContext = createContext<HTMLElement | null>(null)

export function RailTargetProvider({
  target,
  children,
}: {
  target: HTMLElement | null
  children: ReactNode
}) {
  return <RailContext.Provider value={target}>{children}</RailContext.Provider>
}

/** Portal a page's context-rail content into the desktop shell's rail column. */
export function Rail({ children }: { children: ReactNode }) {
  const target = useContext(RailContext)
  if (!target) return null
  return createPortal(children, target)
}
