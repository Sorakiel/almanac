import { ReflectionComposer } from '@/features/reflect/components/ReflectionComposer'
import type { Reflection } from '@/features/reflect/types'

interface ReflectWorkspaceProps {
  dateKey: string
  today: Reflection | null
}

/** Desktop "Reflect" workspace — the daily composer; history lives in the rail. */
export function ReflectWorkspace({ dateKey, today }: ReflectWorkspaceProps) {
  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-7">
        <p className="label-mono">// daily journal</p>
        <h1 className="mt-1.5 text-[44px] leading-none tracking-title">Reflect</h1>
        <p className="mt-2 text-[15px] text-muted">
          A short reflection each day, paired with your quote of the day.
        </p>
      </header>

      <ReflectionComposer dateKey={dateKey} today={today} />
    </div>
  )
}
