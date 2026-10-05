import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import type { HubTile } from '@/features/modules/hub'

interface ModuleTileProps {
  tile: HubTile
  /** Live status line; null while its data loads (the row keeps its height). */
  line: string | null
  /** Switched off in Customize: still opens, drawn faded, says so. */
  off: boolean
}

/** One module on the hub — the whole tile opens it. */
export function ModuleTile({ tile, line, off }: ModuleTileProps) {
  const { t } = useT()
  const Icon = tile.icon
  return (
    <Link
      to={tile.to}
      viewTransition
      className={cn('mods-tile', off && 'is-off')}
      style={{ '--hue': tile.hue } as CSSProperties}
    >
      <span className="mods-ic" aria-hidden="true">
        <Icon strokeWidth={1.9} />
      </span>
      <span>
        <b>{t(`modules.${tile.key}.label`)}</b>
        <small>{off ? t('modulesPage.hidden') : (line ?? ' ')}</small>
      </span>
    </Link>
  )
}
