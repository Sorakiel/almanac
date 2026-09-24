import { cn } from '@/lib/utils'

interface ChipGroupProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

/** A single-choice row of pills (the prototype's .p-chips): ink on the chosen one. */
export function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-11 rounded-pill px-3.5 text-callout font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              on ? 'bg-foreground text-bg' : 'bg-sheet-fill text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
