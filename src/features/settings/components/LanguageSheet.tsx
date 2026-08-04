import { Check } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { LOCALES, type Locale } from '@/i18n'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/stores/locale'
import { cn } from '@/lib/utils'

interface LanguageSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Pick the interface language. Applies instantly — nothing to reload. */
export function LanguageSheet({ open, onOpenChange }: LanguageSheetProps) {
  const { t } = useT()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  const choose = (next: Locale) => {
    setLocale(next)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.languageTitle')}
      description={t('settings.languageDescription')}
    >
      <div className="flex flex-col gap-2">
        {LOCALES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-current={option.value === locale}
            className={cn(
              'flex items-center justify-between rounded-tile border px-4 py-3.5 text-left text-[15px] transition-colors',
              option.value === locale ? 'border-accent bg-surface text-accent' : 'bg-surface',
            )}
          >
            {option.label}
            {option.value === locale ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
          </button>
        ))}
        <p className="text-xs text-muted">{t('settings.languagePartial')}</p>
      </div>
    </Sheet>
  )
}
