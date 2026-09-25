import { cn } from '@/lib/utils'

interface CompactTitleBarProps {
  title: string | null
  visible: boolean
}

/**
 * The phone's compact top bar (prototype `.p-compact`): once the large title
 * has scrolled away its words reappear here at 17px, over a blurred fade of
 * the canvas. Decorative — the real heading is still in the page for screen
 * readers, so this copy is hidden from them.
 */
export function CompactTitleBar({ title, visible }: CompactTitleBarProps) {
  return (
    <div aria-hidden="true" className={cn('compact-title lg:hidden', visible && title && 'is-on')}>
      <span className="truncate px-16">{title}</span>
    </div>
  )
}
