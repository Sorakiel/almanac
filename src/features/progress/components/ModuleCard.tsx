import { useId, useState, type ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

export type ModuleTone = 'accent' | 'teal' | 'amber'

const TONE: Record<ModuleTone, string> = {
  accent: 'bg-accent/[0.18] text-accent',
  teal: 'bg-teal/[0.18] text-teal',
  amber: 'bg-amber/[0.18] text-amber',
}

interface ModuleCardProps {
  icon: LucideIcon
  tone: ModuleTone
  title: string
  /** The one-line metric under the title. */
  summary: string
  /** Spans two columns of the desktop grid. */
  wide?: boolean
  children: ReactNode
}

/**
 * One module's period, as a card. On the phone the details open in place on
 * tap (grid-rows 0fr → 1fr, so the height animates without measuring); on
 * desktop there is room, so they're simply always shown.
 */
export function ModuleCard({ icon: Icon, tone, title, summary, wide, children }: ModuleCardProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const detailsId = useId()

  const head = (
    <>
      <span
        className={cn('grid h-10 w-10 flex-none place-items-center rounded-control', TONE[tone])}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-footnote text-muted">{title}</span>
        <span className="block text-body font-semibold">{summary}</span>
      </span>
    </>
  )

  return (
    <section
      className={cn('overflow-hidden rounded-card bg-surface', wide && 'lg:col-span-2')}
      aria-label={title}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        aria-label={t('progress.expand', { name: title })}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent lg:hidden"
      >
        {head}
        <ChevronRight
          className={cn(
            'h-4 w-4 flex-none text-muted-strong transition-transform duration-300',
            open && 'rotate-90',
          )}
          aria-hidden="true"
        />
      </button>
      <div className="hidden items-center gap-3 px-4 pb-2.5 pt-4 lg:flex">{head}</div>

      <div
        id={detailsId}
        className={cn(
          'grid transition-rows duration-300 ease-sheet motion-reduce:transition-none lg:grid-rows-expanded',
          open ? 'grid-rows-expanded' : 'grid-rows-collapsed',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-2 px-3.5 pb-3.5 lg:px-4 lg:pb-4">{children}</div>
        </div>
      </div>
    </section>
  )
}
