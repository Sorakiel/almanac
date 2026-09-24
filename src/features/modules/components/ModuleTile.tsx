import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { MODULE_HUE } from '@/features/modules/lib/moduleHue'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import type { NavModule } from '@/stores/modules'

interface ModuleTileProps {
  module: NavModule
  /** Switched off in Customize: still opens, drawn faded, says so. */
  off: boolean
}

/** One module on the hub — the whole tile opens it. */
export function ModuleTile({ module, off }: ModuleTileProps) {
  const { t } = useT()
  const Icon = module.icon
  return (
    <Link
      to={module.to}
      className={cn('mods-tile', off && 'is-off')}
      style={{ '--hue': MODULE_HUE[module.key] } as CSSProperties}
    >
      <span className="mods-ic" aria-hidden="true">
        <Icon strokeWidth={1.9} />
      </span>
      <span>
        <b>{t(`modules.${module.key}.label`)}</b>
        <small>{off ? t('modulesPage.hidden') : t(`modules.${module.key}.description`)}</small>
      </span>
    </Link>
  )
}
