import { coverBackground } from '@/features/reading/lib/cover'
import { cn } from '@/lib/utils'

type CoverSize = 'xs' | 'sm' | 'md' | 'lg'

interface BookCoverProps {
  title: string
  author?: string | null
  /** xs 34×50 row thumb · sm 64×94 · md 92×136 shelf and hero · lg 132×196 book page. */
  size?: CoverSize
  className?: string
}

// Whole class names, so Tailwind's content scan keeps each size's rule.
const SIZE_CLASS: Record<CoverSize, string> = {
  xs: 'book-cover-xs',
  sm: 'book-cover-sm',
  md: 'book-cover-md',
  lg: 'book-cover-lg',
}

/**
 * A generated cover (the prototype's `.m-cover`): gradient by title, spine
 * shading on the left edge, the title and author set on it. Decorative — the
 * title is always written next to it too.
 */
export function BookCover({ title, author, size = 'md', className }: BookCoverProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('book-cover', SIZE_CLASS[size], className)}
      style={{ background: coverBackground(title) }}
    >
      {size !== 'xs' ? (
        <>
          <b>{title}</b>
          {author ? <small>{author}</small> : null}
        </>
      ) : null}
    </div>
  )
}
