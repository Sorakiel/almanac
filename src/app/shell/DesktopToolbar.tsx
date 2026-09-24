import { Plus, Search } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'

/**
 * Desktop page toolbar (prototype .dk-tool): sticks to the top of the
 * workspace, fading the content that scrolls under it, with the ⌘K search pill
 * and a "+" on the right.
 */
export function DesktopToolbar() {
  const { t } = useT()
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const openCreate = useUiStore((s) => s.openCreate)

  return (
    <div className="sticky top-0 z-20 -mx-8 hidden h-[60px] items-center gap-2.5 bg-gradient-to-b from-bg from-35% to-bg/0 pl-8 pr-6 lg:flex">
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K"
        className="lg ml-auto flex h-9 w-[300px] items-center gap-2.5 rounded-[18px] pl-3.5 pr-2 text-left text-sm text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Search aria-hidden="true" className="h-4 w-4 flex-none" strokeWidth={2.2} />
        <span className="flex-1 truncate">{t('palette.placeholder')}</span>
        <kbd aria-hidden="true" className="kbd">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => openCreate()}
        aria-label={t('create.title')}
        aria-haspopup="dialog"
        className="lg grid h-9 w-9 place-items-center rounded-full text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
      </button>
    </div>
  )
}
