import type { ReactNode } from 'react'

interface SettingsGroupProps {
  title?: string
  /** A line under the card, e.g. what a privacy switch actually shares. */
  note?: string
  children: ReactNode
}

/** One inset-grouped list, iOS Settings style: heading, rows on a card, note. */
export function SettingsGroup({ title, note, children }: SettingsGroupProps) {
  return (
    <section aria-label={title}>
      {title ? (
        <h2 className="mx-1 mb-2 text-[20px] font-semibold tracking-[-0.015em]">{title}</h2>
      ) : null}
      <div className="overflow-hidden rounded-card bg-surface [&>*+*]:border-t [&>*+*]:border-border/10">
        {children}
      </div>
      {note ? <p className="mx-4 mt-2 text-footnote leading-snug text-muted">{note}</p> : null}
    </section>
  )
}
