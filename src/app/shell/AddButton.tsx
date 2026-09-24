import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateSheet } from '@/app/shell/CreateSheet'
import { useT } from '@/hooks/useT'

/** The bottom nav's central "+": opens the create sheet. */
export function AddButton() {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative -mt-6 flex-none">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('common.quickAdd')}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-[17px] border-[3px] border-bg bg-accent-solid text-2xl leading-none text-on-accent-solid shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-90"
      >
        <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
      </button>
      <CreateSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}
