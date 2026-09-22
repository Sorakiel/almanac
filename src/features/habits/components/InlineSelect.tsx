import { ChevronDown } from 'lucide-react'

interface InlineSelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  ariaLabel: string
}

/** Small native-select dropdown styled to the spec-board "value ▾" look. */
export function InlineSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: InlineSelectProps<T>) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="appearance-none rounded-lg bg-transparent pr-6 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface text-foreground">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 h-4 w-4 text-muted"
        aria-hidden="true"
      />
    </div>
  )
}
