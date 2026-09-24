import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface HabitDetailActionsProps {
  /** Freezing only makes sense for a day that is not done yet. */
  canFreeze: boolean
  frozen: boolean
  onToggleFreeze: () => void
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}

function ActionRow({
  children,
  onClick,
  danger,
  trailing,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[50px] w-full items-center justify-between px-4 text-left text-body transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.06] focus-visible:ring-0 focus-visible:ring-offset-0',
        danger && 'text-danger',
      )}
    >
      {children}
      {trailing}
    </button>
  )
}

const chevron = <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted" />

/**
 * Grouped actions (prototype .p-act): freeze and edit, then Archive in red —
 * reversible, so it goes at once with Undo. Deleting for good sits apart,
 * behind the red action sheet.
 */
export function HabitDetailActions({
  canFreeze,
  frozen,
  onToggleFreeze,
  onEdit,
  onArchive,
  onDelete,
}: HabitDetailActionsProps) {
  const { t } = useT()
  return (
    <section className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-card bg-surface">
        {canFreeze ? (
          <div className="flex min-h-[50px] items-center justify-between gap-3 px-4 text-body">
            <span aria-hidden="true">{t('habits.detail.freeze')}</span>
            <Switch
              aria-label={t('habits.detail.freeze')}
              checked={frozen}
              onCheckedChange={onToggleFreeze}
            />
          </div>
        ) : null}
        <div
          className={cn(
            'divide-y divide-foreground/10',
            canFreeze && 'border-t border-foreground/10',
          )}
        >
          <ActionRow onClick={onEdit} trailing={chevron}>
            {t('habits.edit')}
          </ActionRow>
          <ActionRow onClick={onArchive} danger>
            {t('habits.detail.archive')}
          </ActionRow>
        </div>
      </div>
      <p className="mx-4 text-footnote text-muted">{t('habits.detail.archiveNote')}</p>
      <div className="mt-4 overflow-hidden rounded-card bg-surface">
        <ActionRow onClick={onDelete} danger>
          {t('habits.deleteForever')}
        </ActionRow>
      </div>
    </section>
  )
}
