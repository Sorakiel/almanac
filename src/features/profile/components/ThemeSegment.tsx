import type { ThemePreference } from '@/stores/theme'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface ThemeSegmentProps {
  value: ThemePreference
  onChange: (value: ThemePreference) => void
}

/** Авто · Тёмная · Кофе — the compact segmented control inside the Theme row. */
export function ThemeSegment({ value, onChange }: ThemeSegmentProps) {
  const { t } = useT()
  const options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('profile.themeAuto') },
    { value: 'dark', label: t('profile.themeDark') },
    { value: 'coffee', label: t('profile.themeCoffee') },
  ]
  return (
    <div
      role="tablist"
      aria-label={t('profile.theme')}
      className="flex flex-none rounded-inner bg-sheet-fill p-0.5 dark:bg-foreground/[0.08]"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg px-[9px] py-1.5 text-footnote font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              active
                ? 'bg-sheet shadow-thumb dark:bg-bg'
                : 'text-foreground/80 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
