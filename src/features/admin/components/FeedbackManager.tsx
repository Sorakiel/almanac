import { useState } from 'react'
import { toast } from 'sonner'
import { Check, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useFeedbackManagement } from '@/features/admin/hooks/useFeedbackManagement'
import type { FeedbackRow, FeedbackStatus } from '@/features/admin/types'
import { FeedbackStatusTag } from '@/features/admin/components/FeedbackStatusTag'
import { RoleTag } from '@/features/admin/components/RoleTag'
import { useJoinedLabel } from '@/features/admin/hooks/useJoinedLabel'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/** Bodies longer than this collapse behind a Show more/less toggle. */
const CLAMP_AT = 220

interface FeedbackManagerProps {
  items: FeedbackRow[]
  todayKey: string
  /** Hide the author line (already shown by the surrounding user detail view). */
  hideAuthor?: boolean
}

/** Admin/owner feedback triage list: full text, status changes, delete. */
export function FeedbackManager({ items, todayKey, hideAuthor }: FeedbackManagerProps) {
  const { t } = useT()
  if (items.length === 0) {
    return (
      <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
        {t('admin.noFeedback')}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <FeedbackCard key={item.id} item={item} todayKey={todayKey} hideAuthor={hideAuthor} />
      ))}
    </div>
  )
}

interface FeedbackCardProps {
  item: FeedbackRow
  todayKey: string
  hideAuthor?: boolean
}

function FeedbackCard({ item, todayKey, hideAuthor }: FeedbackCardProps) {
  const { t } = useT()
  const joined = useJoinedLabel()
  const { setStatus, remove, isUpdating, isRemoving } = useFeedbackManagement()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const long = item.body.length > CLAMP_AT

  const changeStatus = async (status: FeedbackStatus, label: string) => {
    try {
      await setStatus({ id: item.id, status })
      toast.success(label)
    } catch (error) {
      toast.error(toUserError(error, t, 'admin.feedbackUpdateFailed'))
    }
  }

  const confirmRemove = async () => {
    try {
      await remove(item.id)
      setConfirmDelete(false)
      toast.success(t('admin.feedbackDeleted'))
    } catch (error) {
      toast.error(toUserError(error, t, 'admin.feedbackDeleteFailed'))
    }
  }

  return (
    <div className="rounded-card border bg-surface px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <FeedbackStatusTag status={item.status} />
        {!hideAuthor ? (
          <>
            <RoleTag role={item.authorRole} />
            <span className="min-w-0 truncate font-mono text-[10px] text-muted-strong">
              {item.authorName}
            </span>
          </>
        ) : null}
        <span className="ml-auto flex-none font-mono text-[10px] text-muted-strong">
          {joined(item.createdAt, todayKey)}
        </span>
      </div>

      <p className={cn('text-sm leading-relaxed', long && !expanded && 'line-clamp-3')}>
        {item.body}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 font-mono text-[10px] uppercase tracking-label text-accent hover:underline"
        >
          {expanded ? t('admin.showLess') : t('admin.showMore')}
        </button>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.status !== 'done' ? (
          <Button
            variant="surface"
            size="sm"
            disabled={isUpdating}
            onClick={() => changeStatus('done', t('admin.resolved'))}
          >
            <Check className="h-4 w-4" /> {t('admin.resolve')}
          </Button>
        ) : null}
        {item.status !== 'closed' ? (
          <Button
            variant="surface"
            size="sm"
            disabled={isUpdating}
            onClick={() => changeStatus('closed', t('admin.rejected'))}
          >
            <X className="h-4 w-4" /> {t('admin.reject')}
          </Button>
        ) : null}
        {item.status !== 'open' ? (
          <Button
            variant="surface"
            size="sm"
            disabled={isUpdating}
            onClick={() => changeStatus('open', t('admin.reopened'))}
          >
            <RotateCcw className="h-4 w-4" /> {t('admin.reopen')}
          </Button>
        ) : null}
        <Button
          variant="surface"
          size="sm"
          className="ml-auto text-accent"
          aria-label={t('admin.deleteFeedback')}
          disabled={isRemoving}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('admin.deleteFeedbackTitle')}
        description={t('admin.deleteFeedbackBody')}
        confirmLabel={isRemoving ? t('admin.deleting') : t('admin.deleteFeedback')}
        pending={isRemoving}
        onConfirm={confirmRemove}
      />
    </div>
  )
}
