import { describe, expect, it } from 'vitest'
import { normalisePath, sanitizeProperties } from '@/lib/analytics'

describe('normalisePath', () => {
  it('collapses row ids so paths group by screen', () => {
    expect(normalisePath('/habits/6f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8')).toBe('/habits/:id')
    expect(normalisePath('/train/6F1A2B3C-4D5E-6F70-8192-A3B4C5D6E7F8/session')).toBe(
      '/train/:id/session',
    )
  })

  it('leaves static paths alone', () => {
    expect(normalisePath('/')).toBe('/')
    expect(normalisePath('/insights')).toBe('/insights')
    expect(normalisePath('/train/edit')).toBe('/train/edit')
  })
})

describe('sanitizeProperties', () => {
  it('scrubs ids from the URL properties PostHog fills in itself', () => {
    const out = sanitizeProperties({
      $current_url: 'https://almanac.app/habits/6f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8',
      $pathname: '/reading/6f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8',
      $initial_referrer: 'https://almanac.app/train/6f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8/session',
    })
    expect(out.$current_url).toBe('https://almanac.app/habits/:id')
    expect(out.$pathname).toBe('/reading/:id')
    expect(out.$initial_referrer).toBe('https://almanac.app/train/:id/session')
  })

  it('drops query strings, which are the other way a URL carries data', () => {
    const out = sanitizeProperties({ $current_url: 'https://almanac.app/reading?title=Dune' })
    expect(out.$current_url).toBe('https://almanac.app/reading')
  })

  it('passes non-URL properties through untouched', () => {
    const out = sanitizeProperties({ streak: 7, frequency: 'daily', $current_url: undefined })
    expect(out).toMatchObject({ streak: 7, frequency: 'daily' })
  })
})
