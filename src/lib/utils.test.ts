import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('keeps a type-scale size next to a text colour', () => {
    expect(cn('text-caption font-medium', 'text-muted')).toBe('text-caption font-medium text-muted')
    expect(cn('text-callout text-foreground')).toBe('text-callout text-foreground')
  })

  it('resolves conflicts inside the custom scales', () => {
    expect(cn('text-footnote', 'text-caption')).toBe('text-caption')
    expect(cn('rounded-card', 'rounded-inner')).toBe('rounded-inner')
  })
})
