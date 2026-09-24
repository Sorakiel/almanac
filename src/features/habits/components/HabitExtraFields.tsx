import { HabitChecklistDraftEditor } from '@/features/habits/components/HabitChecklistDraftEditor'
import {
  HABIT_COLORS,
  HABIT_COLOR_OPTIONS,
  HABIT_ICONS,
  HABIT_ICON_OPTIONS,
  type HabitColor,
  type HabitIcon,
} from '@/features/habits/lib/habitVisuals'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

export interface HabitExtras {
  icon: HabitIcon
  color: HabitColor
  description: string
  checklist: string[]
}

interface HabitExtraFieldsProps {
  value: HabitExtras
  onChange: (value: HabitExtras) => void
}

const LABEL = 'mx-1 mb-2 mt-4 text-footnote font-medium text-muted'

/** "More options" in the quick habit form: colour, icon, a note, a checklist. */
export function HabitExtraFields({ value, onChange }: HabitExtraFieldsProps) {
  const { t } = useT()
  const set = (patch: Partial<HabitExtras>) => onChange({ ...value, ...patch })

  return (
    <>
      <span className={LABEL}>{t('create.color')}</span>
      <div role="radiogroup" aria-label={t('create.color')} className="flex gap-2.5">
        {HABIT_COLOR_OPTIONS.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value.color === key}
            aria-label={t('habits.aria.color', { name: key })}
            onClick={() => set({ color: key })}
            className={cn(
              'h-11 w-11 rounded-full border-[3px] p-1 transition-colors',
              value.color === key ? 'border-foreground' : 'border-transparent',
            )}
          >
            <span className={cn('block h-full w-full rounded-full', HABIT_COLORS[key].solid)} />
          </button>
        ))}
      </div>

      <span className={LABEL}>{t('create.icon')}</span>
      <div role="radiogroup" aria-label={t('create.icon')} className="flex flex-wrap gap-2">
        {HABIT_ICON_OPTIONS.map((key) => {
          const Icon = HABIT_ICONS[key]
          const on = value.icon === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t('habits.aria.icon', { name: key })}
              onClick={() => set({ icon: key })}
              className={cn(
                'grid h-11 w-11 place-items-center rounded-control transition-colors',
                on ? 'bg-foreground text-bg' : 'bg-sheet-fill text-muted hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <label className="contents">
        <span className={LABEL}>{t('create.description')}</span>
        <input
          maxLength={160}
          value={value.description}
          onChange={(event) => set({ description: event.target.value })}
          placeholder={t('create.descriptionPlaceholder')}
          className="h-12 w-full rounded-control bg-sheet-fill px-3.5 text-body text-foreground placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        />
      </label>

      <div className="mt-4">
        <HabitChecklistDraftEditor
          items={value.checklist}
          onChange={(checklist) => set({ checklist })}
        />
      </div>
    </>
  )
}
