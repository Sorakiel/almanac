import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { reflectionDateLabel } from '@/features/reflect/lib/format'
import { moodFor } from '@/features/reflect/lib/moods'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { toastWithUndo } from '@/lib/undoToast'
import { cn } from '@/lib/utils'

interface ReflectHistoryProps {
  past: Reflection[]
}

/**
 * Desktop "Reflect" history under the composer: a mood dot, the date and two
 * lines of the entry; a tap opens it whole in place (the prototype's
 * `.m-entry`), with delete + Undo once open.
 */
export function ReflectHistory({ past }: ReflectHistoryProps) {
  const { t, locale } = useT()
  const dateLocale = intlLocale(locale)
  const { remove, restore } = useReflectionMutations()
  const [openId, setOpenId] = useState<string | null>(null)

  // One tap, no confirm: the row leaves at once and Undo puts the same row back.
  const handleDelete = (reflection: Reflection) => {
    remove.mutate(reflection.id)
    toastWithUndo(t('reflect.deleted'), t('common.undo'), () => restore.mutate(reflection))
    setOpenId(null)
  }

  return (
    <section aria-label={t('reflect.pastLabel')}>
      <h2 className="mx-1.5 mb-2 text-callout font-semibold text-muted">
        {t('reflect.pastLabel')}
      </h2>

      {past.length > 0 ? (
        <ul className="divide-y overflow-hidden rounded-card bg-surface">
          {past.map((reflection) => {
            const open = reflection.id === openId
            const mood = moodFor(reflection.mood)
            const date = reflectionDateLabel(reflection.date, dateLocale)
            return (
              <li key={reflection.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : reflection.id)}
                  aria-expanded={open}
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <span className="flex items-center gap-2 text-footnote font-medium text-muted">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-2.5 w-2.5 flex-none rounded-full',
                        mood ? mood.dot : 'bg-foreground/15',
                      )}
                    />
                    <span className="first-letter:uppercase">
                      {mood ? `${date} · ${t(`dashboard.modules.moods.${mood.key}`)}` : date}
                    </span>
                  </span>
                  {reflection.body ? (
                    <span
                      className={cn(
                        'mt-1 block text-callout',
                        open ? 'whitespace-pre-wrap' : 'line-clamp-2',
                      )}
                    >
                      {reflection.body}
                    </span>
                  ) : null}
                </button>
                {open ? (
                  <div className="flex justify-end px-2 pb-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(reflection)}
                      aria-label={t('reflect.deleteAria', { date })}
                      className="flex h-11 items-center gap-1.5 rounded-control px-3 text-footnote text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('reflect.delete')}
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mx-1.5 text-footnote text-muted">{t('reflect.pastEmptyShort')}</p>
      )}
    </section>
  )
}
