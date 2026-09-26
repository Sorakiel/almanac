import { ReflectionComposer } from '@/features/reflect/components/ReflectionComposer'
import { ReflectHistory } from '@/features/reflect/components/desktop/ReflectHistory'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'

interface ReflectWorkspaceProps {
  dateKey: string
  today: Reflection | null
  past: Reflection[]
  streak: number
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * Desktop "Reflect" workspace — the daily composer, then the past entries;
 * one opens in the inspector.
 */
export function ReflectWorkspace({
  dateKey,
  today,
  past,
  streak,
  selectedId,
  onSelect,
}: ReflectWorkspaceProps) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-7">
        <p className="label-mono">{t('reflect.journalLabel')}</p>
        <h1 className="mt-1.5 text-[44px] leading-none tracking-title">{t('reflect.title')}</h1>
        <p className="mt-2 text-[15px] text-muted">{t('reflect.subtitle')}</p>
      </header>

      <ReflectionComposer dateKey={dateKey} today={today} />
      <ReflectHistory past={past} streak={streak} selectedId={selectedId} onSelect={onSelect} />
    </div>
  )
}
