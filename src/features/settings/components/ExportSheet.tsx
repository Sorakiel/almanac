import { FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useExportData, type ExportFormat } from '@/features/settings/hooks/useExportData'

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
      title="Export data"
      description="Your data is yours. Download a copy at any time."
    >
      <div className="flex flex-col gap-3">
        <Option
          icon={running === 'json' ? Loader2 : FileJson}
          spinning={running === 'json'}
          title="Full archive · JSON"
          hint="Every habit, log, workout, book, note and reflection on this account."
          disabled={pending}
          onClick={() => run('json')}
        />
        <Option
          icon={running === 'csv' ? Loader2 : FileSpreadsheet}
          spinning={running === 'csv'}
          title="Habit log · CSV"
          hint="One row per check-off — date, habit, count, note. Opens in any spreadsheet."
          disabled={pending}
          onClick={() => run('csv')}
        />
        <p className="text-xs text-muted">
          The file is built in your browser and never leaves the device unless you send it
          somewhere.
        </p>
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
