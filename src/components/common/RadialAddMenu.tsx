import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListChecks, Plus, type LucideIcon } from 'lucide-react'
import { OPTIONAL_MODULES, useModulesStore } from '@/stores/modules'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface FanItem {
  key: string
  label: string
  icon: LucideIcon
  run: () => void
}

// Fan geometry: items arc upward from the button, centered on straight up.
const RADIUS = 96
const SPREAD = 150 // total degrees the fan covers
const UP = -90 // straight up, in standard degrees (screen y grows downward)

function itemOffset(i: number, n: number): { x: number; y: number } {
  const angle = n <= 1 ? UP : UP - SPREAD / 2 + (SPREAD * i) / (n - 1)
  const rad = (angle * Math.PI) / 180
  return { x: RADIUS * Math.cos(rad), y: RADIUS * Math.sin(rad) }
}

/**
 * The bottom nav's central "+" — a radial quick-capture. Tap to fan out "New
 * habit" plus a shortcut to each enabled optional module (the ones that don't
 * get a permanent nav slot), so anything the user actually uses is one tap from
 * anywhere. Collapses on action, on an outside tap, or on navigation.
 */
export function RadialAddMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const enabled = useModulesStore((s) => s.enabled)

  const items: FanItem[] = [
    { key: 'habit', label: 'New habit', icon: ListChecks, run: openNewHabit },
    ...OPTIONAL_MODULES.filter((m) => enabled[m.key]).map((m) => ({
      key: m.key,
      label: m.label,
      icon: m.icon,
      run: () => navigate(m.to),
    })),
  ]

  const act = (run: () => void) => {
    setOpen(false)
    run()
  }

  return (
    <div className="relative -mt-6 flex-none">
      {/* Outside-tap catcher — full screen, behind the items. */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-bg-deep/40 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in"
        />
      ) : null}

      <ul className="pointer-events-none absolute left-1/2 top-1/2 z-50">
        {items.map((item, i) => {
          const { x, y } = itemOffset(i, items.length)
          const Icon = item.icon
          return (
            <li
              key={item.key}
              className="ease-[cubic-bezier(0.22,1.4,0.4,1)] absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 motion-reduce:transition-none"
              style={{
                transform: open
                  ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                  : 'translate(-50%, -50%)',
                opacity: open ? 1 : 0,
                transitionDelay: open ? `${i * 35}ms` : '0ms',
              }}
            >
              <button
                type="button"
                onClick={() => act(item.run)}
                tabIndex={open ? 0 : -1}
                aria-hidden={!open}
                className={cn(
                  'pointer-events-auto flex h-12 w-12 flex-col items-center justify-center rounded-[15px] border bg-surface text-accent shadow-soft transition-colors hover:bg-accent hover:text-on-accent',
                  !open && 'pointer-events-none',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </button>
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-label text-muted transition-opacity',
                  open ? 'opacity-100 delay-150' : 'opacity-0',
                )}
              >
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick add' : 'Quick add'}
        aria-expanded={open}
        className="relative z-50 flex h-[52px] w-[52px] items-center justify-center rounded-[17px] border-[3px] border-bg bg-accent text-2xl leading-none text-on-accent shadow-glow transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-90"
      >
        <Plus
          className={cn('h-6 w-6 transition-transform duration-300', open && 'rotate-[135deg]')}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
