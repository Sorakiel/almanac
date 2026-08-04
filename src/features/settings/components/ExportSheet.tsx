import { FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useExportData, type ExportFormat } from '@/features/settings/hooks/useExportData'
import { useT } from '@/hooks/useT'

interface ExportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Take your data out. Two shapes, because they answer different questions: the
 * archive is "everything, so I could leave", the CSV is "my habit log, so I can
 * put it in a spreadsheet".
 */
export function ExportSheet({ open, onOpenChange }: ExportSheetProps) {
  const { t } = useT()
  const exportData = useExportData()
  const pending = exportData.isPending
  const running = pending ? exportData.variables : undefined

  const run = (format: ExportFormat) => {
    exportData.mutate(format, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('export.title')}
      description={t('export.description')}
    >
      <div className="flex flex-col gap-3">
        <Option
          icon={running === 'json' ? Loader2 : FileJson}
          spinning={running === 'json'}
          title={t('export.jsonTitle')}
          hint={t('export.jsonHint')}
          disabled={pending}
          onClick={() => run('json')}
        />
        <Option
          icon={running === 'csv' ? Loader2 : FileSpreadsheet}
          spinning={running === 'csv'}
          title={t('export.csvTitle')}
          hint={t('export.csvHint')}
          disabled={pending}
          onClick={() => run('csv')}
        />
        <p className="text-xs text-muted">{t('export.localNote')}</p>
      </div>
    </Sheet>
  )
}

interface OptionProps {
  icon: typeof FileJson
  spinning: boolean
  title: string
  hint: string
  disabled: boolean
  onClick: () => void
}

function Option({ icon: Icon, spinning, title, hint, disabled, onClick }: OptionProps) {
  return (
    <Button
      variant="surface"
      size="lg"
      className="h-auto w-full justify-start gap-3.5 rounded-tile px-4 py-3.5 text-left"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon
        className={`h-[18px] w-[18px] flex-none text-accent ${spinning ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-medium">{title}</span>
        <span className="text-wrap text-xs font-normal text-muted">{hint}</span>
      </span>
    </Button>
  )
}
