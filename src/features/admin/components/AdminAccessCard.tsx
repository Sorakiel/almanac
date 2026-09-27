import { Crown, ShieldCheck } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { useT } from '@/hooks/useT'

/** Who is looking and what that allows — the side column's first card. */
export function AdminAccessCard({ isOwner }: { isOwner: boolean }) {
  const { t } = useT()
  return (
    <section className="grid gap-3 rounded-card bg-surface p-4">
      <div className="flex items-center gap-3">
        <IconTile
          icon={isOwner ? Crown : ShieldCheck}
          tone={isOwner ? 'bg-teal/15 text-teal' : 'bg-accent/15 text-accent'}
        />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">
            {isOwner ? t('admin.ownerTitle') : t('admin.adminTitle')}
          </p>
          <p className="truncate text-footnote text-muted">
            {isOwner ? t('admin.fullControl') : t('admin.workspaceTools')}
          </p>
        </div>
      </div>
      <p className="text-footnote text-muted">
        {isOwner ? t('admin.ownerNote') : t('admin.adminNote')}
      </p>
    </section>
  )
}
