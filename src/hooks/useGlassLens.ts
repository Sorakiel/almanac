import { useEffect, type RefObject } from 'react'
import {
  LENS_BAND,
  LENS_SCALE,
  REFRACTION_ENABLED,
  lensMap,
  supportsRefraction,
} from '@/lib/glass/lens'

const SVG_NS = 'http://www.w3.org/2000/svg'
const DEFS_ID = 'glass-lens-defs'
/** The frost under the lens is lighter than plain `.lg`: the bend does the work. */
const REFRACT_FILTER = 'blur(3px) saturate(185%)'

/** One hidden <svg> holds every lens filter on the page. */
function defsRoot(): SVGDefsElement {
  const existing = document.getElementById(DEFS_ID)
  if (existing instanceof SVGDefsElement) return existing
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  const defs = document.createElementNS(SVG_NS, 'defs')
  defs.id = DEFS_ID
  svg.appendChild(defs)
  document.body.appendChild(svg)
  return defs
}

/** Build (or rebuild) the filter `id` for a w×h box with corner radius r. */
function writeFilter(id: string, w: number, h: number, r: number): void {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.putImageData(new ImageData(lensMap(w, h, r, LENS_BAND), w, h), 0, 0)

  document.getElementById(id)?.remove()
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.id = id
  for (const [k, v] of [
    ['filterUnits', 'userSpaceOnUse'],
    ['x', '0'],
    ['y', '0'],
    ['width', String(w)],
    ['height', String(h)],
    ['color-interpolation-filters', 'sRGB'],
  ]) {
    filter.setAttribute(k!, v!)
  }
  const image = document.createElementNS(SVG_NS, 'feImage')
  for (const [k, v] of [
    ['href', canvas.toDataURL()],
    ['x', '0'],
    ['y', '0'],
    ['width', String(w)],
    ['height', String(h)],
    ['result', 'map'],
    ['preserveAspectRatio', 'none'],
  ]) {
    image.setAttribute(k!, v!)
  }
  const displace = document.createElementNS(SVG_NS, 'feDisplacementMap')
  for (const [k, v] of [
    ['in', 'SourceGraphic'],
    ['in2', 'map'],
    ['scale', String(LENS_SCALE)],
    ['xChannelSelector', 'R'],
    ['yChannelSelector', 'G'],
  ]) {
    displace.setAttribute(k!, v!)
  }
  filter.append(image, displace)
  defsRoot().appendChild(filter)
}

/**
 * Give a `.lg` element real refraction at its rim (Chromium only, behind
 * REFRACTION_ENABLED, off under prefers-reduced-transparency). The lens is
 * sized to the element and rebuilt when it resizes; everywhere else the
 * element keeps the plain frosted glass from globals.css.
 */
export function useGlassLens(ref: RefObject<HTMLElement | null>, id: string): void {
  useEffect(() => {
    const el = ref.current
    if (!el || !REFRACTION_ENABLED || !supportsRefraction()) return
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return

    let size = ''
    const build = () => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (w === 0 || h === 0 || `${w}x${h}` === size) return
      size = `${w}x${h}`
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2
      writeFilter(id, w, h, Math.min(radius, h / 2, w / 2))
      el.style.backdropFilter = `url(#${id}) ${REFRACT_FILTER}`
    }
    build()
    const observer = new ResizeObserver(build)
    observer.observe(el)
    return () => {
      observer.disconnect()
      el.style.backdropFilter = ''
      document.getElementById(id)?.remove()
    }
  }, [ref, id])
}
