/**
 * Liquid-glass refraction, ported from `makeLens` in the redesign's
 * demo-glass.html. A displacement map pushes the backdrop outward along the
 * edge of a rounded rectangle — the glass bends what's behind it near its rim
 * and leaves the middle alone.
 *
 * Chromium-only by nature: only Blink applies an SVG `url(#filter)` inside
 * `backdrop-filter`. Safari and Firefox keep the plain frosted `.lg`.
 */

/** Off switch for the whole effect — progressive enhancement, easy to pull. */
export const REFRACTION_ENABLED = true

/** Tuning from the prototype's tab bar: an 18 px band, 40 px of push at the rim. */
export const LENS_BAND = 18
export const LENS_SCALE = 40

/** Signed distance from (x, y) to a w×h rectangle with corner radius r (negative inside). */
function roundedRectSdf(x: number, y: number, w: number, h: number, r: number): number {
  const hx = w / 2
  const hy = h / 2
  const qx = Math.abs(x - hx) - (hx - r)
  const qy = Math.abs(y - hy) - (hy - r)
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r
}

/**
 * The RGBA displacement map: red = x push, green = y push, 128 = none. Inside
 * the band next to the edge the push points inward along the edge normal and
 * grows quadratically towards the rim.
 */
export function lensMap(
  w: number,
  h: number,
  r: number,
  band = LENS_BAND,
): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(new ArrayBuffer(w * h * 4))
  const sdf = (x: number, y: number): number => roundedRectSdf(x, y, w, h, r)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const s = sdf(x + 0.5, y + 0.5)
      let dx = 0
      let dy = 0
      if (s < 0 && -s < band) {
        const gx = sdf(x + 1.5, y + 0.5) - sdf(x - 0.5, y + 0.5)
        const gy = sdf(x + 0.5, y + 1.5) - sdf(x + 0.5, y - 0.5)
        const len = Math.hypot(gx, gy) || 1
        const m = (1 + s / band) ** 2
        dx = (-gx / len) * m
        dy = (-gy / len) * m
      }
      data[i] = 128 + dx * 127
      data[i + 1] = 128 + dy * 127
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }
  return data
}

/** Chromium (Chrome, Edge, the Android WebView) by its client hints. */
export function supportsRefraction(nav: Navigator | undefined = globalThis.navigator): boolean {
  const brands = (nav as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    ?.userAgentData?.brands
  return Boolean(brands?.some((b) => /Chromium|Chrome|Edge/.test(b.brand)))
}
