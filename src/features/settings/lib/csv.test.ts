import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

const BOM = '\uFEFF'

describe('toCsv', () => {
  it('writes a header and one line per row', () => {
    const csv = toCsv(['date', 'count'], [{ date: '2026-08-01', count: 2 }])
    expect(csv).toBe(`${BOM}date,count\r\n2026-08-01,2\r\n`)
  })

  it('quotes commas, quotes and newlines', () => {
    const csv = toCsv(['note'], [{ note: 'said "hi", then\nleft' }])
    expect(csv).toBe(`${BOM}note\r\n"said ""hi"", then\nleft"\r\n`)
  })

  it('renders null and undefined as empty, not as the word', () => {
    const csv = toCsv(['a', 'b'], [{ a: null, b: undefined }])
    expect(csv).toBe(`${BOM}a,b\r\n,\r\n`)
  })

  it('keeps column order even when the row is keyed differently', () => {
    const csv = toCsv(['b', 'a'], [{ a: 1, b: 2 }])
    expect(csv).toBe(`${BOM}b,a\r\n2,1\r\n`)
  })
})
