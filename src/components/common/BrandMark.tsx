import { cn } from '@/lib/utils'

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * The diamond is a cut-out, not a shape: its border has to match the surface
   * behind the tile, so panels on `bg-deep` need this instead of the default.
   */
  onDeep?: boolean
  glow?: boolean
  className?: string
}

// Radius, cut-out and stroke scale with the tile — keep them in step here.
const SIZES = {
  sm: { tile: 'h-[30px] w-[30px] rounded-[9px]', cut: 'h-[10px] w-[10px] border-[1.6px]' },
  md: { tile: 'h-[34px] w-[34px] rounded-[10px]', cut: 'h-[11px] w-[11px] border-[1.8px]' },
  lg: { tile: 'h-11 w-11 rounded-[13px]', cut: 'h-3.5 w-3.5 border-[1.8px]' },
  xl: { tile: 'h-[72px] w-[72px] rounded-[22px]', cut: 'h-6 w-6 border-[2.4px]' },
} as const

/** Almanac brand mark — accent gradient tile with a rotated diamond cut-out. */
export function BrandMark({
  size = 'md',
  onDeep = false,
  glow = false,
  className,
}: BrandMarkProps) {
  const s = SIZES[size]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex flex-none items-center justify-center bg-gradient-to-br from-accent-bright to-accent-deep',
        s.tile,
        glow && 'shadow-glow',
        className,
      )}
    >
      <span className={cn('rotate-45', s.cut, onDeep ? 'border-bg-deep' : 'border-bg')} />
    </span>
  )
}
