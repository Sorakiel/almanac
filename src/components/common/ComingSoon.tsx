import type { LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'

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
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-2xl">
      <header>
        <p className="label-mono">// {eyebrow}</p>
        <h1 className="mt-1 text-2xl">{title}</h1>
      </header>

      <div className="flex flex-col items-center gap-4 rounded-card border border-dashed px-6 py-16 text-center">
        <IconTile icon={icon} size="lg" tone="bg-accent/15 text-accent" />
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold">In the works</p>
          <p className="max-w-xs text-sm text-muted">{description}</p>
        </div>
        <span className="label-mono rounded-pill border px-3 py-1">{phase}</span>
      </div>
    </div>
  )
}
