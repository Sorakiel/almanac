import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'
import { useT } from '@/hooks/useT'

/** Today's quote under the mood grid — the prototype's `.m-quote`. */
export function DailyQuote() {
  const { t } = useT()
  const { quote } = useDailyQuote()
  if (!quote) return null
  return (
    <figure className="px-1">
      <blockquote className="text-callout italic leading-relaxed text-muted">
        «{quote.text}»
      </blockquote>
      <figcaption className="mt-1 text-footnote font-medium text-muted-strong">
        {quote.author ?? t('reflect.unknownAuthor')}
      </figcaption>
    </figure>
  )
}
