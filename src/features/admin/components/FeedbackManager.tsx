import { useState } from 'react'
import { toast } from 'sonner'
import { Check, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/common/Tag'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useFeedbackManagement } from '@/features/admin/hooks/useFeedbackManagement'
import { joinedLabel } from '@/features/admin/lib/format'
import type { FeedbackRow, FeedbackStatus } from '@/features/admin/types'

const STATUS_TONE: Record<FeedbackStatus, 'accent' | 'teal' | 'amber' | 'muted'> = {
  open: 'amber',
  planned: 'accent',
  done: 'teal',
  closed: 'muted',
}

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
  if (items.length === 0) {
    return (
      <p className="rounded-card border bg-surface px-4 py-6 text-center text-sm text-muted">
        No feedback submitted.
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
  const { setStatus, remove, isUpdating, isRemoving } = useFeedbackManagement()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const long = item.body.length > CLAMP_AT

  const changeStatus = async (status: FeedbackStatus, label: string) => {
    try {
      await setStatus({ id: item.id, status })
      toast.success(label)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update feedback')
    }
  }

  const confirmRemove = async () => {
    try {
      await remove(item.id)
      setConfirmDelete(false)
      toast.success('Feedback deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete feedback')
    }
  }

  return (
    <div className="rounded-card border bg-surface px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Tag tone={STATUS_TONE[item.status]}>{item.status}</Tag>
        {!hideAuthor ? (
          <span className="min-w-0 truncate font-mono text-[10px] text-muted-strong">
            {item.authorName}
          </span>
        ) : null}
        <span className="ml-auto flex-none font-mono text-[10px] text-muted-strong">
          {joinedLabel(item.createdAt, todayKey)}
        </span>
      </div>

      <p className={`text-sm leading-relaxed ${long && !expanded ? 'line-clamp-3' : ''}`}>
        {item.body}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 font-mono text-[10px] uppercase tracking-label text-accent hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.status !== 'done' ? (
          <Button
            variant="surface"
            size="sm"
            disabled={isUpdating}
            onClick={() => changeStatus('done', 'Marked resolved')}
          >
            <Check className="h-4 w-4" /> Resolve
          </Button>
        ) : null}
        {item.status !== 'closed' ? (
          <Button
            variant="surface"
            size="sm"
            disabled={isUpdating}
            onClick={() => changeStatus('closed', 'Feedback rejected')}
          >
            <X className="h-4 w-4" /> Reject
          </Button>
        ) : null}
        {item.status !== 'open' ? (
          <Button
            variant="surface"
            size="sm"
            disabled={isUpdating}
            onClick={() => changeStatus('open', 'Feedback reopened')}
          >
            <RotateCcw className="h-4 w-4" /> Reopen
          </Button>
        ) : null}
        <Button
          variant="surface"
          size="sm"
          className="ml-auto text-accent"
          aria-label="Delete feedback"
          disabled={isRemoving}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this feedback?"
        description="This permanently removes the feedback item. This cannot be undone."
        confirmLabel={isRemoving ? 'Deleting…' : 'Delete feedback'}
        pending={isRemoving}
        onConfirm={confirmRemove}
      />
    </div>
  )
}
