import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Sheet } from '@/components/ui/sheet'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useBookMutations } from '@/features/reading/hooks/useBookMutations'
import { unitNounPlural } from '@/features/reading/lib/progress'
import type { Book, BookProgressMode } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'

const schema = z.object({
  title: z.string().trim().min(1, 'reading.form.titleRequired').max(160),
  author: z.string().trim().max(160).optional(),
  total: z.string().trim().optional(),
  dailyGoal: z.string().trim().optional(),
})

type FormValues = z.infer<typeof schema>

interface BookFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this book (and can delete it). */
  book?: Book | null
  onDeleted?: () => void
}

/** Add or edit a book — title, author, how progress is tracked, and length. */
export function BookFormSheet({ open, onOpenChange, book, onDeleted }: BookFormSheetProps) {
  const { t } = useT()
  const { create, update, remove } = useBookMutations()
  const [mode, setMode] = useState<BookProgressMode>(book?.progress_mode ?? 'pages')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEdit = Boolean(book)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: book?.title ?? '',
      author: book?.author ?? '',
      total: book?.total_units ? String(book.total_units) : '',
      dailyGoal: book?.daily_goal ? String(book.daily_goal) : '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const parsed = values.total ? Number.parseInt(values.total, 10) : NaN
    const total_units = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    const parsedGoal = values.dailyGoal ? Number.parseInt(values.dailyGoal, 10) : NaN
    const daily_goal = Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null
    const fields = {
      title: values.title,
      author: values.author?.trim() ? values.author.trim() : null,
      progress_mode: mode,
      total_units,
      daily_goal,
    }

    try {
      if (book) {
        await update.mutateAsync({ id: book.id, patch: fields })
        toast.success(t('reading.form.updated'))
      } else {
        await create.mutateAsync(fields)
        toast.success(t('reading.form.added'))
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reading.form.saveFailed'))
    }
  })

  const onDelete = async () => {
    if (!book) return
    try {
      await remove.mutateAsync(book.id)
      toast.success(t('reading.form.removed'))
      setConfirmDelete(false)
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reading.form.removeFailed'))
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? t('reading.form.editTitle') : t('reading.form.addTitle')}
        description={isEdit ? undefined : t('reading.form.addDescription')}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{t('reading.form.titleLabel')}</span>
            <Input
              placeholder={t('reading.form.titlePlaceholder')}
              autoFocus
              {...register('title')}
            />
            {errors.title ? (
              <span className="text-xs text-accent">
                {t(errors.title.message as TranslationKey)}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{t('reading.form.author')}</span>
            <Input placeholder={t('reading.form.authorPlaceholder')} {...register('author')} />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="label-mono">{t('reading.form.trackBy')}</span>
            <Segmented
              aria-label={t('reading.form.modeLabel')}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pages', label: t('reading.form.pages') },
                { value: 'chapters', label: t('reading.form.chapters') },
              ]}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Total {unitNounPlural(mode, t)} (optional)</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={t('reading.form.totalPlaceholder')}
              {...register('total')}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">
              Daily goal · {unitNounPlural(mode, t)} / day (optional)
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={t('reading.form.dailyGoalPlaceholder')}
              {...register('dailyGoal')}
            />
          </label>

          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? t('reading.form.saving')
              : isEdit
                ? t('reading.form.save')
                : t('reading.form.create')}
          </Button>

          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="text-accent"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              {t('reading.form.remove')}
            </Button>
          ) : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('reading.form.removeConfirm')}
        description={book ? t('reading.removeBookDescription', { title: book.title }) : undefined}
        confirmLabel={remove.isPending ? t('reading.form.removing') : t('reading.form.remove')}
        pending={remove.isPending}
        onConfirm={onDelete}
      />
    </>
  )
}
