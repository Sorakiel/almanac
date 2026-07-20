/** Tone of an insight line — drives its prompt glyph and accent colour. */
export type InsightTone = 'urgent' | 'good' | 'info'

/** One rule-derived observation rendered by the shared InsightTicker. */
export interface InsightLine {
  id: string
  text: string
  tone: InsightTone
}
