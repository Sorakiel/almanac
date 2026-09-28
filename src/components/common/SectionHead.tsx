import type { ReactNode } from 'react'

interface SectionHeadProps {
  children: ReactNode
  aside?: ReactNode
}

/** The prototype's `.p-sec-h`: a section title with a quiet note on the right. */
export function SectionHead({ children, aside }: SectionHeadProps) {
  return (
    <div className="mx-1 mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-headline font-semibold tracking-title">{children}</h2>
      {aside ? <span className="text-callout text-muted">{aside}</span> : null}
    </div>
  )
}
