import { Crown, ShieldCheck } from 'lucide-react'
import { RailCard, RailNote, RailRow } from '@/components/rail/RailCard'
import { RailIdentity } from '@/components/rail/RailIdentity'
import type { AdminData } from '@/features/admin/types'
import { FeedbackStatusTag } from '@/features/admin/components/FeedbackStatusTag'
import { useJoinedLabel } from '@/features/admin/hooks/useJoinedLabel'
import { useT } from '@/hooks/useT'

interface AdminRailProps {
  data: AdminData
  /** The viewer is the owner — unlocks role management, shown in the header. */
  isOwner: boolean
  todayKey: string
}

/** Desktop Admin context rail: workspace counters, feedback, caution note. */
export function AdminRail({ data, isOwner, todayKey }: AdminRailProps) {
  const { t } = useT()
  const joined = useJoinedLabel()
  const { overview, feedback } = data
  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity
        icon={isOwner ? Crown : ShieldCheck}
        tone={isOwner ? 'bg-teal/15 text-teal' : 'bg-accent/15 text-accent'}
        title={isOwner ? t('admin.ownerTitle') : t('admin.adminTitle')}
        subtitle={isOwner ? t('admin.fullControl') : t('admin.workspaceTools')}
      />

      <RailCard label={t('admin.thisWorkspace')}>
        <RailRow label={t('admin.members')} value={String(overview.totalMembers)} />
        <RailRow label={t('admin.activeToday')} value={String(overview.activeToday)} />
        <RailRow label={t('admin.admins')} value={String(overview.admins)} />
        <RailRow label={t('admin.new7d')} value={String(overview.newThisWeek)} />
      </RailCard>

      <RailCard label={t('admin.feedbackRail')}>
        {feedback.length === 0 ? (
          <p className="text-[13px] text-muted">{t('admin.noFeedbackYet')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {feedback.slice(0, 4).map((f) => (
              <li key={f.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 truncate font-mono text-[10px] text-muted-strong">
                    {f.authorName}
                  </span>
                  <FeedbackStatusTag status={f.status} className="flex-none" />
                  <span className="ml-auto flex-none font-mono text-[10px] text-muted-strong">
                    {joined(f.createdAt, todayKey)}
                  </span>
                </div>
                <p className="line-clamp-2 text-[12.5px] leading-snug text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        )}
      </RailCard>

      <RailNote
        label={isOwner ? t('admin.ownerAccess') : t('admin.elevatedAccess')}
        tone={isOwner ? 'teal' : 'accent'}
      >
        {isOwner ? t('admin.ownerNote') : t('admin.adminNote')}
      </RailNote>
    </div>
  )
}
