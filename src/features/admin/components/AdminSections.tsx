import { FeedbackManager } from '@/features/admin/components/FeedbackManager'
import { MembersTable } from '@/features/admin/components/MembersTable'
import { SignupsChart } from '@/features/admin/components/SignupsChart'
import { SupportManager } from '@/features/admin/components/SupportManager'
import type { AdminData } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

interface AdminSectionsProps {
  data: AdminData
  todayKey: string
  isOwner: boolean
  currentUserId: string
  chartHeight?: number
}

/** The console's body under the headline stats — same on phone and desktop. */
export function AdminSections({
  data,
  todayKey,
  isOwner,
  currentUserId,
  chartHeight,
}: AdminSectionsProps) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-5 lg:gap-8">
      <div>
        <p className="label-mono mb-3">{t('admin.signupsPerWeek')}</p>
        <SignupsChart weeks={data.signups} height={chartHeight} />
      </div>
      <div>
        <p className="label-mono mb-3">{t('admin.recentSignups')}</p>
        <MembersTable
          members={data.members}
          todayKey={todayKey}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
      </div>
      <div>
        <p className="label-mono mb-3">{t('admin.feedbackLabel')}</p>
        <FeedbackManager items={data.feedback} todayKey={todayKey} />
      </div>
      {isOwner ? (
        <div>
          <p className="label-mono mb-3">{t('admin.supportLabel')}</p>
          <SupportManager />
        </div>
      ) : null}
    </div>
  )
}
