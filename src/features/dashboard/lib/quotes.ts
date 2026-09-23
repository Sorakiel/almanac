import type { Quote } from '@/features/dashboard/api/quotes.api'
import type { Locale } from '@/i18n'

/**
 * The quote as it reads in `locale`, or null when it has no text there. A
 * Russian screen hides an untranslated quote rather than show it in English.
 * The author falls back to the original spelling — a name is still a name.
 */
export function localizeQuote(quote: Quote, locale: Locale): Quote | null {
  if (locale === 'en') return quote
  if (!quote.text_ru) return null
  return { ...quote, text: quote.text_ru, author: quote.author_ru ?? quote.author }
}

/** Every quote readable in `locale`, in their original order. */
export function localizeQuotes(quotes: Quote[], locale: Locale): Quote[] {
  return quotes.flatMap((q) => localizeQuote(q, locale) ?? [])
}
