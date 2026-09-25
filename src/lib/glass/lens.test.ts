import { describe, expect, it } from 'vitest'
import { lensMap, supportsRefraction } from '@/lib/glass/lens'

const px = (
  data: Uint8ClampedArray,
  w: number,
  x: number,
  y: number,
): [number, number, number, number] => {
  const i = (y * w + x) * 4
  return [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!]
}

describe('lensMap', () => {
  const w = 120
  const h = 40
  const map = lensMap(w, h, 20, 18)

  it('leaves the middle of the glass undisplaced', () => {
    expect(px(map, w, 60, 20)).toEqual([128, 128, 128, 255])
  })

  it('pushes inward near the edge, strongest at the rim', () => {
    const [, nearTop] = px(map, w, 60, 1)
    const [, deeper] = px(map, w, 60, 10)
    expect(nearTop).toBeGreaterThan(128) // top edge: push down, into the glass
    expect(nearTop).toBeGreaterThan(deeper)
    const [leftEdge] = px(map, w, 1, 20)
    expect(leftEdge).toBeGreaterThan(128) // left edge: push right
  })

  it('fills every pixel', () => {
    expect(map.length).toBe(w * h * 4)
  })
})

describe('supportsRefraction', () => {
  const nav = (brands: string[]): Navigator =>
    ({ userAgentData: { brands: brands.map((brand) => ({ brand })) } }) as unknown as Navigator

  it('is on for Chromium brands only', () => {
    expect(supportsRefraction(nav(['Chromium', 'Google Chrome']))).toBe(true)
    expect(supportsRefraction(nav(['Microsoft Edge']))).toBe(true)
    expect(supportsRefraction({} as Navigator)).toBe(false)
    expect(supportsRefraction(undefined)).toBe(false)
  })
})
