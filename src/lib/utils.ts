import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's default scale. The project's own type
 * scale and radii (tailwind.config.ts) must be declared, or `text-caption`
 * is taken for a text colour and silently dropped next to `text-muted` — the
 * pill tags lost their size exactly that way.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['large-title', 'title', 'headline', 'body', 'callout', 'footnote', 'caption'] },
      ],
      rounded: [{ rounded: ['sheet', 'card', 'tile', 'control', 'inner', 'pill'] }],
    },
  },
})

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
