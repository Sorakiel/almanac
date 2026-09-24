import { describe, expect, it } from 'vitest'
import { detentOffset, dragOffset, settleDrag } from '@/lib/detents'

const H = 800

describe('detents', () => {
  it('rests medium 42 % down, large at the top', () => {
    expect(detentOffset('medium', H)).toBe(336)
    expect(detentOffset('large', H)).toBe(0)
  })

  it('a short drag from medium settles back on medium', () => {
    expect(settleDrag(360, 336, H)).toBe('medium')
  })

  it('a fling up opens fully; a fling down dismisses', () => {
    expect(settleDrag(280, 336, H)).toBe('large')
    expect(settleDrag(450, 336, H)).toBe('closed')
  })

  it('past 62 % dismisses even slowly; above 25 % opens fully', () => {
    expect(settleDrag(500, 480, H)).toBe('closed')
    expect(settleDrag(190, 200, H)).toBe('large')
  })

  it('resists being pulled above the top', () => {
    expect(dragOffset(0, -80)).toBe(-20)
    expect(dragOffset(336, 40)).toBe(376)
  })
})
