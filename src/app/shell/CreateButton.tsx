import { Plus } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'

/** The bottom nav's central "+": opens the Create sheet. */
export function CreateButton() {
  const { t } = useT()
  const openCreate = useUiStore((s) => s.openCreate)
  const open = useUiStore((s) => s.create !== null)

  return (
    <div className="relative -mt-6 flex-none">
      <button
        type="button"
        onClick={() => openCreate()}
        aria-label={t('create.title')}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group flex h-[52px] w-[52px] items-center justify-center rounded-[17px] border-[3px] border-bg bg-accent-solid text-on-accent-solid shadow-glow transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-90"
      >
        <Plus
          className="h-6 w-6 transition-transform duration-300 group-aria-expanded:rotate-45"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
