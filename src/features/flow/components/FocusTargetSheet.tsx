import { useState } from 'react'
import { BookOpen, Check } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useT } from '@/hooks/useT'
import { useModulesStore } from '@/stores/modules'

/** What a block is for: a habit due today, a book being read, or free text. */
export type FocusTargetChoice =
  | { kind: 'habit'; id: string; label: string }
  | { kind: 'book'; id: string; label: string }
  | { kind: 'custom'; label: string }

interface FocusTargetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: FocusTargetChoice | null
  onPick: (target: FocusTargetChoice | null) => void
}

const ROW =
  'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-body transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent'

/** «На что» — pick the block's target: today's habits, open books, or your own words. */
export function FocusTargetSheet({ open, onOpenChange, value, onPick }: FocusTargetSheetProps) {
  const { t } = useT()
  const { habits } = useHabits()
  const { books } = useBooks()
  const readingOn = useModulesStore((s) => s.enabled.reading)
  const [text, setText] = useState(value?.kind === 'custom' ? value.label : '')
  const due = habits.filter((h) => h.dueToday && !h.isComplete)
  const reading = readingOn ? books.filter((b) => b.status === 'reading') : []
  const choose = (target: FocusTargetChoice | null) => {
    onPick(target)
    onOpenChange(false)
  }
  const isOn = (kind: string, id?: string) =>
    value?.kind === kind && (id === undefined || ('id' in value && value.id === id))

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('flow.targetTitle')}>
      <div className="flex flex-col gap-4 pb-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const label = text.trim()
            choose(label ? { kind: 'custom', label } : null)
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('flow.focusPlaceholder')}
            aria-label={t('flow.focusPrompt')}
            className="h-12 min-w-0 flex-1 rounded-control bg-sheet-fill px-3.5 text-body placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="submit"
            className="h-12 flex-none rounded-control bg-accent-solid px-4 text-callout font-semibold text-on-accent-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t('flow.targetApply')}
          </button>
        </form>

        {due.length > 0 ? (
          <section aria-label={t('flow.modeHabit')}>
            <h3 className="mx-1 mb-1.5 text-footnote font-medium text-muted">
              {t('flow.targetHabits')}
            </h3>
            <ul className="divide-y overflow-hidden rounded-card bg-sheet-fill">
              {due.map((h) => {
                const Icon = resolveHabitIcon(h.icon)
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      className={ROW}
                      aria-pressed={isOn('habit', h.id)}
                      onClick={() => choose({ kind: 'habit', id: h.id, label: h.name })}
                    >
                      <Icon className="h-5 w-5 flex-none text-teal" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{h.name}</span>
                      {isOn('habit', h.id) ? (
                        <Check className="h-5 w-5 flex-none text-accent" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {reading.length > 0 ? (
          <section aria-label={t('flow.modeRead')}>
            <h3 className="mx-1 mb-1.5 text-footnote font-medium text-muted">
              {t('flow.targetBooks')}
            </h3>
            <ul className="divide-y overflow-hidden rounded-card bg-sheet-fill">
              {reading.map((b) => {
                const label = t('flow.readingTarget', { title: b.title })
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={ROW}
                      aria-pressed={isOn('book', b.id)}
                      onClick={() => choose({ kind: 'book', id: b.id, label })}
                    >
                      <BookOpen className="h-5 w-5 flex-none text-amber" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{b.title}</span>
                      {isOn('book', b.id) ? (
                        <Check className="h-5 w-5 flex-none text-accent" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {value ? (
          <button
            type="button"
            onClick={() => choose(null)}
            className="min-h-11 rounded-control text-callout text-muted hover:text-foreground"
          >
            {t('flow.targetClear')}
          </button>
        ) : null}
      </div>
    </Sheet>
  )
}
