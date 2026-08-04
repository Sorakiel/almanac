import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { fetchExport } from '@/features/settings/api/export.api'
import { toCsv } from '@/features/settings/lib/csv'
import { saveFile } from '@/features/settings/lib/download'
import { APP_VERSION } from '@/lib/version'
import { trackEvent } from '@/lib/analytics'

export type ExportFormat = 'json' | 'csv'

const HABIT_LOG_COLUMNS = ['date', 'habit', 'count', 'note']

function stamp(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Download everything the account owns. JSON is the complete archive; CSV is the
 * habit log flattened for a spreadsheet, which is the only shape anyone has asked
 * for so far.
 */
export function useExportData(): UseMutationResult<void, Error, ExportFormat> {
  const { user } = useSession()

  return useMutation<void, Error, ExportFormat>({
    mutationFn: async (format) => {
      if (!user) throw new Error('Not signed in')
      const payload = await fetchExport(user.id, user.email ?? null, APP_VERSION)
      const date = stamp(payload.exportedAt)

      if (format === 'json') {
        await saveFile(`almanac-${date}.json`, JSON.stringify(payload, null, 2), 'application/json')
        return
      }

      const names = new Map(
        (payload.data.habits ?? []).map((h) => [h.id as string, (h.name as string) ?? '']),
      )
      const rows = [...(payload.data.habit_logs ?? [])]
        .map((log) => ({
          date: log.date,
          habit: names.get(log.habit_id as string) ?? '',
          count: log.count,
          note: log.note,
        }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))

      await saveFile(
        `almanac-habits-${date}.csv`,
        toCsv(HABIT_LOG_COLUMNS, rows),
        'text/csv;charset=utf-8',
      )
    },
    onSuccess: (_result, format) => {
      trackEvent('data_exported', { format })
      toast.success('Export ready')
    },
    onError: (error) => {
      toast.error(error.message || 'Could not export your data')
    },
  })
}
