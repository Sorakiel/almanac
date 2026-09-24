import { useState, type KeyboardEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { usePaletteCommands, type PaletteCommand } from '@/app/hooks/usePaletteCommands'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

/**
 * ⌘K: find a command by typing, ↑↓ to pick, ↵ to run. Ported from the desktop
 * prototype's .dk-pal — a glass panel over a light scrim, centred on the
 * workspace (right of the sidebar) on desktop.
 */
export function CommandPalette() {
  const { t } = useT()
  const open = useUiStore((s) => s.paletteOpen)
  const setOpen = useUiStore((s) => s.setPaletteOpen)
  const commands = usePaletteCommands()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const q = query.trim().toLowerCase()
  const matches = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands
  const index = Math.min(selected, Math.max(matches.length - 1, 0))

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
      setSelected(0)
    }
  }

  const run = (command: PaletteCommand | undefined) => {
    if (!command) return
    onOpenChange(false)
    command.run()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(Math.min(matches.length - 1, index + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(Math.max(0, index - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(matches[index])
    }
  }

  const optionId = (i: number) => `palette-option-${i}`

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="palette-scrim fixed inset-0 z-50 bg-black/[0.28]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="palette lg fixed left-1/2 top-24 z-50 w-[min(580px,calc(100vw-32px))] overflow-hidden rounded-[22px] lg:left-[calc(50%+126px)]"
        >
          <Dialog.Title className="sr-only">{t('palette.title')}</Dialog.Title>
          {/* The palette's only field: the caret and the selected row show focus;
              a ring here gets clipped into a stray line along the panel. */}
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            onKeyDown={onKeyDown}
            placeholder={t('palette.placeholder')}
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={matches.length ? optionId(index) : undefined}
            className="h-14 w-full border-b border-foreground/10 bg-transparent px-5 text-[19px] text-foreground outline-none placeholder:text-muted-strong focus-visible:ring-0"
          />
          <ul id="palette-list" role="listbox" className="max-h-[340px] overflow-y-auto p-1.5">
            {matches.length === 0 ? (
              <li className="flex h-11 items-center px-3 text-callout text-muted-strong">
                {t('palette.empty')}
              </li>
            ) : (
              matches.map((command, i) => {
                const Icon = command.icon
                const on = i === index
                return (
                  <li
                    key={command.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={on}
                    onMouseMove={() => !on && setSelected(i)}
                    onClick={() => run(command)}
                    className={cn(
                      'flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-callout',
                      on && 'bg-accent/[0.16]',
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      strokeWidth={1.9}
                      className={cn(
                        'h-[18px] w-[18px] flex-none',
                        on ? 'text-accent' : 'text-muted',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{command.label}</span>
                    <span className="flex-none text-xs text-muted-strong">{command.group}</span>
                  </li>
                )
              })
            )}
          </ul>
          <div className="flex gap-3.5 border-t border-foreground/10 px-4 pb-2.5 pt-2 text-xs text-muted-strong">
            <span>{t('palette.hintMove')}</span>
            <span>{t('palette.hintRun')}</span>
            <span>{t('palette.hintClose')}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
