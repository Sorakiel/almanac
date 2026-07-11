import type { LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { Rail } from '@/components/common/desktop/rail'

interface ComingSoonProps {
  eyebrow: string
  title: string
  icon: LucideIcon
  description: string
  phase: string
}

/** Placeholder for modules that arrive in a later phase — keeps nav complete. */
export function ComingSoon({ eyebrow, title, icon, description, phase }: ComingSoonProps) {
  return (
    <>
      <div className="flex flex-col gap-5 lg:max-w-[760px]">
        <header>
          <p className="label-mono">// {eyebrow}</p>
          <h1 className="mt-1 text-2xl lg:mt-1.5 lg:text-[32px] lg:tracking-title">{title}</h1>
        </header>

        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed px-6 py-16 text-center lg:py-24">
          <IconTile icon={icon} size="lg" tone="bg-accent/15 text-accent" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">In the works</p>
            <p className="max-w-xs text-sm text-muted">{description}</p>
          </div>
          <span className="label-mono rounded-pill border px-3 py-1">{phase}</span>
        </div>
      </div>

      <Rail>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <IconTile icon={icon} tone="bg-accent/15 text-accent" size="sm" />
            <div>
              <p className="text-[15px] font-semibold">{title}</p>
              <p className="font-mono text-[10px] text-muted-strong">on the roadmap</p>
            </div>
          </div>
          <div className="rounded-[18px] border bg-surface p-[18px]">
            <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
              status
            </p>
            <div className="mt-2 flex items-center justify-between text-[13.5px]">
              <span className="text-muted">planned for</span>
              <span className="font-mono text-accent">{phase}</span>
            </div>
          </div>
          <p className="px-1 text-[13px] italic leading-relaxed text-muted">{description}</p>
        </div>
      </Rail>
    </>
  )
}
