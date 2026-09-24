import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Book, Check, Dumbbell, Pencil, Timer, type LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { DetentSheet } from '@/components/ui/detent-sheet'
import { NewHabitForm } from '@/features/habits/components/NewHabitForm'
import { useT } from '@/hooks/useT'
import type { Detent } from '@/lib/detents'
import { useFocusStore } from '@/stores/focus'
import { useModulesStore, type ModuleKey } from '@/stores/modules'
import { useUiStore } from '@/stores/ui'

/** One Flow session from the grid — the prototype's "Timer 25 min". */
const FOCUS_MINUTES = 25

interface CreateAction {
  key: 'habit' | 'workout' | 'reflect' | 'book' | 'focus'
  /** The module that must be on for the tile to show; habits are always there. */
  module: ModuleKey | null
  icon: LucideIcon
  tone: string
}

const ACTIONS: CreateAction[] = [
  { key: 'habit', module: null, icon: Check, tone: 'bg-accent/15 text-accent' },
  { key: 'workout', module: 'workouts', icon: Dumbbell, tone: 'bg-teal/15 text-teal' },
  { key: 'reflect', module: 'reflect', icon: Pencil, tone: 'bg-teal/15 text-teal' },
  { key: 'book', module: 'reading', icon: Book, tone: 'bg-amber/15 text-amber' },
  { key: 'focus', module: 'flow', icon: Timer, tone: 'bg-accent/15 text-accent' },
]

/**
 * The "+" sheet: a grid of what can be made — only for modules that are on —
 * and the quick habit form in place. Opens at the medium detent; the habit
 * form lifts it to large so the keyboard never covers the button.
 */
export function CreateSheet() {
  const { t } = useT()
  const navigate = useNavigate()
  const view = useUiStore((s) => s.create)
  const openCreate = useUiStore((s) => s.openCreate)
  const closeCreate = useUiStore((s) => s.closeCreate)
  const enabled = useModulesStore((s) => s.enabled)
  const startFocus = useFocusStore((s) => s.start)
  // Keyed by view so reopening starts where the view does, not where a drag left it.
  const [detents, setDetents] = useState<Record<'menu' | 'habit', Detent>>({
    menu: 'medium',
    habit: 'large',
  })

  const actions = ACTIONS.filter((a) => a.module === null || enabled[a.module])

  const run = (key: CreateAction['key']) => {
    if (key === 'habit') {
      setDetents((d) => ({ ...d, habit: 'large' }))
      openCreate('habit')
      return
    }
    closeCreate()
    if (key === 'workout') navigate('/train?new=1')
    if (key === 'book') navigate('/reading?new=1')
    if (key === 'reflect') navigate('/reflect')
    if (key === 'focus') {
      startFocus(FOCUS_MINUTES)
      navigate('/flow')
    }
  }

  const current = view ?? 'menu'
  const onOpenChange = (open: boolean) => {
    if (open) return
    closeCreate()
    setDetents({ menu: 'medium', habit: 'large' })
  }

  return (
    <DetentSheet
      open={view !== null}
      onOpenChange={onOpenChange}
      title={current === 'habit' ? t('create.habitTitle') : t('create.title')}
      detent={detents[current]}
      onDetentChange={(detent) => setDetents((d) => ({ ...d, [current]: detent }))}
    >
      {current === 'habit' ? (
        <NewHabitForm onDone={() => onOpenChange(false)} />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => run(action.key)}
              className="grid justify-items-start gap-2.5 rounded-card bg-sheet-fill p-3.5 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
            >
              <IconTile icon={action.icon} tone={action.tone} size="sm" />
              <span className="text-callout font-semibold">
                {t(`create.actions.${action.key}.label`)}
                <span className="block text-footnote font-normal text-muted">
                  {t(`create.actions.${action.key}.hint`)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </DetentSheet>
  )
}
