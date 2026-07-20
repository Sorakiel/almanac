import { useEffect } from 'react'
import { create } from 'zustand'

interface BreadcrumbState {
  /** Slugified name of the current detail entity, or null on list/flat routes. */
  leaf: string | null
  setLeaf: (leaf: string | null) => void
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  leaf: null,
  setLeaf: (leaf) => set({ leaf }),
}))

const MAX_SEGMENT = 18

/**
 * Turn a human entity name into a shell-path segment: lowercase, spaces to
 * hyphens, drop anything that isn't a latin/cyrillic letter or digit (emoji,
 * punctuation), collapse repeats, and cap the length so a chatty title can't
 * blow out the prompt. Empty result falls back to "detail".
 */
export function slugifySegment(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9Ѐ-ӿ-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!slug) return 'detail'
  return slug.length > MAX_SEGMENT ? `${slug.slice(0, MAX_SEGMENT)}…` : slug
}

/**
 * Register the current detail page's name as the breadcrumb leaf so the desktop
 * TopBar can render `~/habits/<name>` instead of a generic `detail`. Pass the
 * entity name once loaded (undefined while it's still fetching); the leaf is
 * cleared on unmount so the next route starts clean.
 */
export function useBreadcrumbLeaf(name: string | null | undefined): void {
  const setLeaf = useBreadcrumbStore((s) => s.setLeaf)
  useEffect(() => {
    setLeaf(name ? slugifySegment(name) : null)
    return () => setLeaf(null)
  }, [name, setLeaf])
}
