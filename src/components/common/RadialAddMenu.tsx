import { useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ListChecks, Plus, RotateCw, X, type LucideIcon } from 'lucide-react'
import { OPTIONAL_MODULES, useModulesStore } from '@/stores/modules'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

interface FanItem {
  key: string
  label: string
  icon: LucideIcon
  run: () => void
}

// Geometry (degrees; screen y grows downward, so "up" is -90).
const UP = -90
const STEP = 34 // angular gap between items
const ITEM_RADIUS = 98
const LABEL_RADIUS = 138
// Items within this of straight-up show fully. Sized so the realistic maximum
// (New habit + all five optional modules = 6) still fits as a static fan; the
// dial only engages if the module list ever grows past that.
const HALF_WINDOW = 88
const FADE = 22 // fade band beyond the window before the horizon

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}

/** Shortest distance of `angle` from straight-up, in [0, 180]. */
function offFromUp(angle: number): number {
  return Math.abs(((angle - UP + 540) % 360) - 180)
}

/**
 * The bottom nav's central "+" — a radial quick-capture. Tap to fan out "New
 * habit" plus a shortcut to each enabled optional module. Up to five items sit
 * in a static arc; beyond that the arc becomes a dial you swipe or scroll to
 * rotate, with off-arc items fading past the horizon.
 *
 * The overlay is portaled to <body> so its full-screen scrim escapes the nav's
 * backdrop-blur containing block, and anchored to the measured button position.
 */
export function RadialAddMenu() {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const [rotation, setRotation] = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)
  const drag = useRef({ active: false, moved: false, startAngle: 0, startRot: 0 })
  const navigate = useNavigate()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const enabled = useModulesStore((s) => s.enabled)

  const moduleItems: FanItem[] = OPTIONAL_MODULES.filter((m) => enabled[m.key]).map((m) => ({
    key: m.key,
    label: m.label,
    icon: m.icon,
    run: () => navigate(m.to),
  }))
  // Seat "New habit" (the primary capture) in the middle so it sits at the top
  // of the fan, with the module shortcuts fanning out to either side.
  const mid = Math.floor(moduleItems.length / 2)
  const habitItem: FanItem = {
    key: 'habit',
    label: 'New habit',
    icon: ListChecks,
    run: openNewHabit,
  }
  const items: FanItem[] = [...moduleItems.slice(0, mid), habitItem, ...moduleItems.slice(mid)]

  const n = items.length
  const half = (n - 1) / 2
  // How far the fan can rotate before its centre item leaves the window.
  const maxRot = Math.max(0, half * STEP - HALF_WINDOW)
  const overflow = maxRot > 0.5

  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setRotation(0)
    setOpen(true)
  }
  const close = () => setOpen(false)
  const act = (run: () => void) => {
    close()
    run()
  }

  const pointerAngle = (e: ReactPointerEvent): number => {
    if (!anchor) return 0
    return (Math.atan2(e.clientY - anchor.y, e.clientX - anchor.x) * 180) / Math.PI
  }

  const onScrimDown = (e: ReactPointerEvent) => {
    drag.current = { active: true, moved: false, startAngle: pointerAngle(e), startRot: rotation }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onScrimMove = (e: ReactPointerEvent) => {
    if (!drag.current.active) return
    if (!drag.current.moved && (Math.abs(e.movementX) > 1 || Math.abs(e.movementY) > 1)) {
      drag.current.moved = true
    }
    if (!overflow) return
    let delta = pointerAngle(e) - drag.current.startAngle
    delta = ((delta + 540) % 360) - 180 // shortest way round
    setRotation(clamp(drag.current.startRot + delta, -maxRot, maxRot))
  }
  const onScrimUp = () => {
    const wasDrag = drag.current.moved
    drag.current.active = false
    if (!wasDrag) close() // a tap on the scrim dismisses
  }
  const onWheel = (e: WheelEvent) => {
    if (overflow) setRotation((r) => clamp(r - e.deltaY * 0.15, -maxRot, maxRot))
  }

  return (
    <div className="relative -mt-6 flex-none">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? close() : openMenu())}
        aria-label={open ? 'Close quick add' : 'Quick add'}
        aria-expanded={open}
        className={cn(
          'flex h-[52px] w-[52px] items-center justify-center rounded-[17px] border-[3px] border-bg bg-accent text-2xl leading-none text-on-accent shadow-glow transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-90',
          open && 'opacity-0',
        )}
      >
        <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
      </button>

      {open && anchor
        ? createPortal(
            <div className="fixed inset-0 z-[80] select-none">
              {/* Full-screen scrim: dims + blurs, drag/scroll rotates, tap closes. */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Close menu"
                onPointerDown={onScrimDown}
                onPointerMove={onScrimMove}
                onPointerUp={onScrimUp}
                onWheel={onWheel}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close()
                }}
                className="absolute inset-0 cursor-default touch-none bg-bg-deep/70 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in"
              />

              {items.map((item, i) => {
                const angle = UP + (i - half) * STEP + rotation
                const opacity = clamp((HALF_WINDOW + FADE - offFromUp(angle)) / FADE, 0, 1)
                const pos = polar(ITEM_RADIUS, angle)
                const lab = polar(LABEL_RADIUS, angle)
                const interactive = opacity > 0.5
                const Icon = item.icon
                return (
                  <div key={item.key} style={{ opacity }} aria-hidden={!interactive}>
                    <button
                      type="button"
                      onClick={() => act(item.run)}
                      disabled={!interactive}
                      aria-label={item.label}
                      className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[15px] border border-accent/25 bg-surface text-accent shadow-glow transition-colors hover:bg-accent hover:text-on-accent disabled:pointer-events-none motion-safe:animate-cell-in"
                      style={{
                        left: anchor.x + pos.x,
                        top: anchor.y + pos.y,
                        animationDelay: `${i * 28}ms`,
                      }}
                    >
                      <Icon className="h-[19px] w-[19px]" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <span
                      aria-hidden="true"
                      className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-bg-deep/85 px-2 py-0.5 font-mono text-[9px] uppercase tracking-label text-foreground shadow-soft"
                      style={{ left: anchor.x + lab.x, top: anchor.y + lab.y }}
                    >
                      {item.label}
                    </span>
                  </div>
                )
              })}

              {/* Overflow affordance: hint that the dial turns. */}
              {overflow ? (
                <span
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-label text-muted"
                  style={{ left: anchor.x, top: anchor.y - (LABEL_RADIUS + 34) }}
                >
                  <RotateCw className="h-3 w-3" aria-hidden="true" /> drag to turn
                </span>
              ) : null}

              {/* The "×" sits exactly over the resting "+" and closes the menu. */}
              <button
                type="button"
                onClick={close}
                aria-label="Close quick add"
                className="absolute flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[17px] border-[3px] border-bg bg-accent text-on-accent shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-90"
                style={{ left: anchor.x, top: anchor.y }}
              >
                <X className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
