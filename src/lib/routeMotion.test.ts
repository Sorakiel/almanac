import { describe, expect, it } from 'vitest'
import { hasEntered, markEntered, routeMotion } from '@/lib/routeMotion'

describe('routeMotion', () => {
  it('switches tabs between top-level screens', () => {
    expect(routeMotion('/', '/progress')).toBe('tab')
    expect(routeMotion('/more', '/habits')).toBe('tab')
  })

  it('pushes deeper and pops back out', () => {
    expect(routeMotion('/habits', '/habits/abc')).toBe('push')
    expect(routeMotion('/habits/abc', '/habits')).toBe('pop')
    expect(routeMotion('/more', '/more/customize')).toBe('push')
    expect(routeMotion('/more/customize', '/more')).toBe('pop')
  })

  it('treats a screen off the tab bar as a push from any tab, and back as a pop', () => {
    expect(routeMotion('/', '/profile')).toBe('push')
    expect(routeMotion('/profile', '/')).toBe('pop')
    expect(routeMotion('/', '/habits/abc')).toBe('push')
  })

  it('pops on a history back even between siblings', () => {
    expect(routeMotion('/train/a', '/train/b', true)).toBe('pop')
    expect(routeMotion('/train/a', '/train/b')).toBe('push')
  })

  it('ignores a trailing slash', () => {
    expect(routeMotion('/more/', '/more')).toBe('tab')
  })
})

describe('entrance once per screen', () => {
  it('remembers a screen once it has been left', () => {
    expect(hasEntered('/reading')).toBe(false)
    markEntered('/reading/')
    expect(hasEntered('/reading')).toBe(true)
  })
})
