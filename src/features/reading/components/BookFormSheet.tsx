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

const schema = z.object({
  title: z.string().trim().min(1, 'Give the book a title').max(160),
  author: z.string().trim().max(160).optional(),
  total: z.string().trim().optional(),
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
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const parsed = values.total ? Number.parseInt(values.total, 10) : NaN
    const total_units = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    const fields = {
      title: values.title,
      author: values.author?.trim() ? values.author.trim() : null,
      progress_mode: mode,
      total_units,
    }

    try {
      if (book) {
        await update.mutateAsync({ id: book.id, patch: fields })
        toast.success('Book updated')
      } else {
        await create.mutateAsync(fields)
        toast.success('Book added')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the book')
    }
  })

  const onDelete = async () => {
    if (!book) return
    try {
      await remove.mutateAsync(book.id)
      toast.success('Book removed')
      setConfirmDelete(false)
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the book')
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? 'Edit book' : 'Add a book'}
        description={isEdit ? undefined : 'Start your shelf — track progress by pages or chapters.'}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Title</span>
            <Input placeholder="e.g. Deep Work" autoFocus {...register('title')} />
            {errors.title ? (
              <span className="text-xs text-accent">{errors.title.message}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Author (optional)</span>
            <Input placeholder="e.g. Cal Newport" {...register('author')} />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="label-mono">Track progress by</span>
            <Segmented
              aria-label="Progress mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pages', label: 'Pages' },
                { value: 'chapters', label: 'Chapters' },
              ]}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Total {unitNounPlural(mode)} (optional)</span>
            <Input type="number" inputMode="numeric" min={1} placeholder="e.g. 320" {...register('total')} />
          </label>

          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add book'}
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
              Remove book
            </Button>
          ) : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Remove this book?"
        description={book ? `"${book.title}", its notes, and sessions will be removed.` : undefined}
        confirmLabel={remove.isPending ? 'Removing…' : 'Remove book'}
        pending={remove.isPending}
        onConfirm={onDelete}
      />
    </>
  )
}
