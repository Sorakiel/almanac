/** RFC 4180 quoting: wrap in quotes when needed, and double any quote inside. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/**
 * Rows to CSV, columns taken from `columns`. Excel only reads UTF-8 correctly when
 * the file starts with a BOM, and Russian habit names are the norm here.
 */
export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((c) => cell(row[c])).join(','))
  return `\uFEFF${lines.join('\r\n')}\r\n`
}
