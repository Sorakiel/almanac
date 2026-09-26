import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface InspectorProps {
  open: boolean
  onClose: () => void
  /** What kind of thing is inspected — "Habit"; the panel's name and kicker. */
  label: string
  children: ReactNode
}

/**
 * The desktop inspector (desktop-prototype.html `.dk-insp`): a panel that
 * slides in over the content's right edge when a list item is selected, and
 * takes no width in the layout. Closed, it waits off-screen and inert, so its
 * content can stay mounted and play the slide out.
 *
 * Portaled to <body>: a screen's entrance leaves a transform on its column,
 * which would otherwise pin `fixed` to that column instead of the window.
 * Desktop only — a phone opens the item as its own page.
 */
export function Inspector({ open, onClose, label, children }: InspectorProps) {
  const { t } = useT()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <aside
      aria-label={label}
      inert={!open}
      className={cn(
        'app-scroll fixed bottom-2 right-2 top-2 z-20 hidden w-inspector overflow-y-auto rounded-inspector bg-surface px-4.5 pb-6 pt-4 shadow-inspector lg:block',
        'transition-transform duration-inspector ease-sheet motion-reduce:transition-none',
        open ? 'translate-x-0' : 'translate-x-inspector-hidden',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-footnote text-muted">{label}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="grid h-9 w-9 place-items-center rounded-full bg-sheet-fill text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      {/* Cards inside sit a level up, on the nested tone (`.dk-insp .p-streak`). */}
      <div className="inspector-nest">{children}</div>
    </aside>,
    document.body,
  )
}
