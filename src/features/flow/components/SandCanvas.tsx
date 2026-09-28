import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

interface SandCanvasProps {
  /** 0 → 1, how much of the block has run; the pile rises with it. */
  progress: number
  /** A session is on (running or paused) — a taller dune. */
  active: boolean
  /** Grains are falling: running and not paused. */
  flowing: boolean
}

type Rgb = [number, number, number]
interface Grain {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}
interface Roller {
  x: number
  y: number
  dir: number
  v: number
  life: number
  r: number
}

const WHITE: Rgb = [255, 255, 255]
const EMBER: Rgb = [40, 20, 10]

/** A token's `r g b` triplet from the canvas's own computed style. */
function tokenRgb(el: Element, name: string, fallback: Rgb): Rgb {
  const parts = getComputedStyle(el).getPropertyValue(name).trim().split(/\s+/).map(Number)
  return parts.length === 3 && parts.every(Number.isFinite) ? (parts as Rgb) : fallback
}

function mix(a: Rgb, b: Rgb, t: number): string {
  return `rgb(${a.map((x, i) => Math.round(x + ((b[i] ?? x) - x) * t)).join(',')})`
}

/**
 * The hourglass inside the dial (prototype `MOD.sandFrame`): a dune of amber
 * sand that rises with the session, fed by a thin falling stream while it runs
 * and still when paused. One rAF loop per canvas; reduced motion keeps the
 * pile and drops the stream.
 */
export function SandCanvas({ progress, active, flowing }: SandCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  // Read by the loop every frame without restarting it.
  const live = useRef({ progress, active, flowing })
  useEffect(() => {
    live.current = { progress, active, flowing: flowing && !prefersReducedMotion() }
  }, [progress, active, flowing])

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const amber = tokenRgb(cv, '--color-amber', [224, 170, 69])
    const accent = tokenRgb(cv, '--color-accent', [232, 116, 59])
    const c = {
      hi: mix(amber, WHITE, 0.35),
      top: mix(amber, WHITE, 0.12),
      mid: mix(amber, accent, 0.35),
      deep: mix(amber, accent, 0.8),
      grain: mix(amber, WHITE, 0.2),
      dark: mix(accent, EMBER, 0.45),
    }
    let grains: Grain[] = []
    let rollers: Roller[] = []
    let level: number | null = null
    let peak = 0
    let size = 0
    let dots: [number, number, boolean, number][] = []
    let frame = 0

    const draw = () => {
      frame = requestAnimationFrame(draw)
      const S = cv.clientWidth
      if (!S) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (size !== S) {
        size = S
        cv.width = S * dpr
        cv.height = S * dpr
        dots = Array.from({ length: Math.round((S * S) / 55) }, () => [
          Math.random() * S,
          Math.random() * S,
          Math.random() < 0.5,
          Math.random() * 0.9 + 0.4,
        ])
      }
      const { progress: prog, active: run, flowing: flow } = live.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, S, S)
      const target = 0.1 + 0.72 * (run ? prog : 0)
      const mid = S / 2
      level = level === null ? target : level + (target - level) * 0.06
      peak += ((flow ? 0.075 : run ? 0.06 : 0.025) * S - peak) * 0.04
      const base = S * (1 - level)
      const w = 0.26 * S
      const surf = (x: number) => {
        const d = (x - mid) / w
        return base - peak * Math.exp(-d * d)
      }

      if (flow) {
        for (let n = 0; n < 3; n++) {
          grains.push({
            x: mid + (Math.random() - 0.5) * 2.4,
            y: -2 - Math.random() * 6,
            vx: (Math.random() - 0.5) * 0.12,
            vy: 1.2 + Math.random() * 0.8,
            r: Math.random() * 0.7 + 0.7,
          })
        }
        ctx.strokeStyle = c.grain
        ctx.globalAlpha = 0.35
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(mid, 0)
        ctx.lineTo(mid, surf(mid) - 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // The pile, shaded top to bottom, speckled, with faint strata.
      ctx.beginPath()
      ctx.moveTo(0, S)
      for (let x = 0; x <= S; x += 2) ctx.lineTo(x, surf(x))
      ctx.lineTo(S, S)
      ctx.closePath()
      const g = ctx.createLinearGradient(0, base - peak, 0, S)
      g.addColorStop(0, c.top)
      g.addColorStop(0.45, c.mid)
      g.addColorStop(1, c.deep)
      ctx.fillStyle = g
      ctx.fill()
      ctx.save()
      ctx.clip()
      for (const [dx, dy, light, ds] of dots) {
        if (dy < surf(dx) - 1) continue
        ctx.fillStyle = light ? c.hi : c.dark
        ctx.globalAlpha = light ? 0.55 : 0.22
        ctx.fillRect(dx, dy, ds, ds)
      }
      ctx.globalAlpha = 0.18
      ctx.strokeStyle = c.dark
      ctx.lineWidth = 1
      for (let k = 1; k < 4; k++) {
        ctx.beginPath()
        for (let x = 0; x <= S; x += 4) {
          const y = surf(x) + k * S * 0.07 + Math.sin((x / S) * 6 + k * 2) * 2
          if (x) ctx.lineTo(x, y)
          else ctx.moveTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      for (let x = 0; x <= S; x += 2) {
        if (x) ctx.lineTo(x, surf(x))
        else ctx.moveTo(x, surf(x))
      }
      ctx.strokeStyle = c.hi
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.globalAlpha = 1

      // Grains in the air, then rolling down the dune.
      ctx.fillStyle = c.grain
      grains = grains.filter((p) => {
        p.vy += 0.22
        p.x += p.vx
        p.y += p.vy
        const s = surf(p.x)
        if (p.y >= s) {
          if (Math.random() < 0.35) {
            rollers.push({
              x: p.x,
              y: s,
              dir: Math.random() < 0.5 ? -1 : 1,
              v: 0.6 + Math.random() * 1.2,
              life: 18 + Math.random() * 30,
              r: p.r,
            })
          }
          return false
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        return true
      })
      ctx.fillStyle = c.hi
      rollers = rollers.filter((r) => {
        r.x += r.dir * r.v
        r.v *= 0.97
        r.life--
        r.y = surf(r.x) - r.r * 0.6
        if (r.life <= 0) return false
        ctx.globalAlpha = Math.min(1, r.life / 12)
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        return true
      })
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={ref} className="flow-sand" aria-hidden="true" />
}
