import { describe, expect, it } from 'vitest'
import { localizeQuote, localizeQuotes } from '@/features/dashboard/lib/quotes'
import type { Quote } from '@/features/dashboard/api/quotes.api'

const quote = (over: Partial<Quote> = {}): Quote => ({
  id: 'q1',
  text: 'Discipline equals freedom.',
  author: 'Jocko Willink',
  text_ru: 'Дисциплина — это свобода.',
  author_ru: 'Джоко Виллинк',
  ...over,
})

describe('localizeQuote', () => {
  it('keeps the original in English', () => {
    expect(localizeQuote(quote(), 'en')?.text).toBe('Discipline equals freedom.')
  })

  it('reads the Russian text and author in Russian', () => {
    expect(localizeQuote(quote(), 'ru')).toMatchObject({
      id: 'q1',
      text: 'Дисциплина — это свобода.',
      author: 'Джоко Виллинк',
    })
  })

  it('falls back to the original author, never to the English text', () => {
    expect(localizeQuote(quote({ author_ru: null }), 'ru')?.author).toBe('Jocko Willink')
    expect(localizeQuote(quote({ text_ru: null }), 'ru')).toBeNull()
  })

  it('drops untranslated quotes from the Russian set', () => {
    const list = [quote(), quote({ id: 'q2', text_ru: null })]
    expect(localizeQuotes(list, 'ru').map((q) => q.id)).toEqual(['q1'])
    expect(localizeQuotes(list, 'en')).toHaveLength(2)
  })
})
