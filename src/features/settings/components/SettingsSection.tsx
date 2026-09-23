import type { ReactNode } from 'react'
import { SectionLabel } from '@/components/common/SectionLabel'

interface SettingsSectionProps {
  label: string
  children: ReactNode
}

/** A labelled group of settings rows on one card, hairlines between rows. */
export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-2" aria-label={label}>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-col divide-y divide-border/10 rounded-card border bg-surface px-4">
        {children}
      </div>
    </section>
  )
}
