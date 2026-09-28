import { useState, type CSSProperties } from 'react'
import { MoodFace } from '@/features/reflect/components/MoodFace'
import { MOODS } from '@/features/reflect/lib/moods'
import { useT } from '@/hooks/useT'
import { haptic } from '@/lib/platform/haptics'
import { cn } from '@/lib/utils'

interface MoodPickerProps {
  value: number | null
  onChange: (mood: number | null) => void
}

/**
 * Five faces (prototype `.m-moods`): the chosen one pops with a tilt and sits
 * on a tile of its own colour; the rest go grey. Tapping it again clears it.
 */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useT()
  // Bumped on every pick so the pop replays even on the same face.
  const [pop, setPop] = useState(0)

  return (
    <div role="group" aria-label={t('reflect.ratings.mood')} className="reflect-moods">
      {MOODS.map((m) => {
        const on = value === m.value
        return (
          <button
            key={m.value}
            type="button"
            aria-pressed={on}
            onClick={() => {
              haptic('light')
              if (on) return onChange(null)
              setPop((n) => n + 1)
              onChange(m.value)
            }}
            className={cn(
              'reflect-mood',
              on && 'is-on',
              on && pop > 0 && 'is-pop',
              value !== null && !on && 'is-dim',
            )}
            style={{ '--fc': `rgb(var(--color-mood-${m.value}))` } as CSSProperties}
          >
            <MoodFace key={on ? pop : 0} mood={m.value} />
            <span className="max-w-full truncate">{t(`dashboard.modules.moods.${m.key}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
