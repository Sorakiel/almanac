import type { ReactNode } from 'react'

/** The one-sentence takeaway under a card's details. */
export function DetailNote({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-footnote leading-snug text-muted">{children}</p>
}
