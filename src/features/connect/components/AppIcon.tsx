import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AppIconProps {
  name: string
  iconUrl: string | null
  size?: 'sm' | 'lg'
}

const SIZES = {
  sm: 'h-9 w-9 rounded-tile text-callout',
  lg: 'h-16 w-16 rounded-2xl text-title',
} as const

/** The app's registered icon, or its initial on a tile when there is none (or it fails). */
export function AppIcon({ name, iconUrl, size = 'sm' }: AppIconProps) {
  const [failed, setFailed] = useState(false)
  const box = cn('flex shrink-0 items-center justify-center overflow-hidden', SIZES[size])

  if (iconUrl && !failed) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={cn(box, 'object-cover')}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span aria-hidden="true" className={cn(box, 'bg-accent/15 font-semibold text-accent')}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
