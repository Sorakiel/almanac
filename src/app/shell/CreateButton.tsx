import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { useGlassLens } from '@/hooks/useGlassLens'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'

/** The phone's glass "+", standing apart from the tab bar: opens the Create sheet. */
export function CreateButton() {
  const { t } = useT()
  const openCreate = useUiStore((s) => s.openCreate)
  const open = useUiStore((s) => s.create !== null)
  const ref = useRef<HTMLButtonElement>(null)
  useGlassLens(ref, 'glass-lens-plus')

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => openCreate()}
      aria-label={t('create.title')}
      aria-haspopup="dialog"
      aria-expanded={open}
      className="tabbar-plus lg"
    >
      <Plus aria-hidden="true" />
    </button>
  )
}
