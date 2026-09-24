import { useNavigate } from 'react-router-dom'
import { ListChecks, type LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { Sheet } from '@/components/ui/sheet'
import { NAV_MODULES, useModulesStore, type ModuleKey } from '@/stores/modules'
import { useUiStore } from '@/stores/ui'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'

interface CreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Modules that have something to create, in the order the grid shows them. */
const CREATABLE: { key: ModuleKey; label: TranslationKey; tone: string }[] = [
  { key: 'workouts', label: 'common.create.workouts', tone: 'bg-teal/15 text-teal' },
  { key: 'reflect', label: 'common.create.reflect', tone: 'bg-accent/15 text-accent' },
  { key: 'reading', label: 'common.create.reading', tone: 'bg-accent/15 text-accent' },
  { key: 'flow', label: 'common.create.flow', tone: 'bg-accent/15 text-accent' },
]

interface Action {
  key: string
  label: string
  icon: LucideIcon
  tone: string
  run: () => void
}

/**
 * What the "+" opens: one tile per thing you can create — a habit, then each
 * enabled module that has something to add. A plain grid rather than a radial
 * fan: every option is readable at once and reachable by keyboard.
 */
export function CreateSheet({ open, onOpenChange }: CreateSheetProps) {
  const { t } = useT()
  const navigate = useNavigate()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const enabled = useModulesStore((s) => s.enabled)

  const actions: Action[] = [
    {
      key: 'habit',
      label: t('common.create.habit'),
      icon: ListChecks,
      tone: 'bg-accent/15 text-accent',
      run: openNewHabit,
    },
    ...CREATABLE.filter((c) => enabled[c.key]).flatMap((c) => {
      const module = NAV_MODULES.find((m) => m.key === c.key)
      if (!module) return []
      return [
        {
          key: c.key,
          label: t(c.label),
          icon: module.icon,
          tone: c.tone,
          run: () => navigate(module.to),
        },
      ]
    }),
  ]

  const act = (run: () => void) => {
    onOpenChange(false)
    run()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('common.createTitle')}>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => act(a.run)}
            className="flex min-h-[88px] flex-col items-start justify-between gap-3 rounded-card border bg-surface p-4 text-left font-semibold transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <IconTile icon={a.icon} tone={a.tone} size="sm" />
            {a.label}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
