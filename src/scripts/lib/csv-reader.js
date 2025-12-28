import fs from 'fs'

/**
 * CsvReader: reads semicolon-delimited CSV and returns JSON objects.
 * - Handles quoted fields, doubled quotes, and newlines inside quotes
 * - By default uses header row; can override with explicit headers or no headers
 */
export default class CsvReader {
  /**
   * @param {{ delimiter?: string, hasHeaders?: boolean, headers?: string[] }} [options]
   *  - delimiter: field separator (default ';')
   *  - hasHeaders: when true (default), first row is treated as headers
   *  - headers: explicit headers to use (overrides hasHeaders)
   */
  constructor(options = {}) {
    const { delimiter = ';', hasHeaders = true, headers } = options
    this.delimiter = delimiter
    this.hasHeaders = hasHeaders
    this.headers = Array.isArray(headers) && headers.length ? [...headers] : undefined
  }

  /**
   * Read and parse a CSV file to JSON objects.
   * @param {string} filePath
   * @returns {Promise<Array<Record<string,string>>>}
   */
  async read(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('CsvReader.read: filePath must be a non-empty string')
    }

    const raw = await fs.readFile(filePath, 'utf8')
    const text = this._stripBom(raw)
    const rows = this._parseCsv(text, this.delimiter)

    if (!rows.length) return []

    let headers = this.headers
    let dataRows = rows

    if (Array.isArray(headers) && headers.length) {
      // use explicit headers as-is
    } else if (this.hasHeaders) {
      headers = rows[0] || []
      dataRows = rows.slice(1)
    } else {
      const width = rows.reduce((m, r) => Math.max(m, r.length), 0)
      headers = Array.from({ length: width }, (_, i) => `col${i + 1}`)
    }

    const out = []
    for (const r of dataRows) {
      const obj = {}
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = r[i] ?? ''
      }
      out.push(obj)
    }
    return out
  }

  _stripBom(s) {
    if (s && s.charCodeAt(0) === 0xfeff) return s.slice(1)
    return s
  }

  /**
   * Parse CSV text into array of rows (arrays of strings).
   * Respects delimiter, quotes, and newlines inside quotes.
   * @param {string} text
   * @param {string} delimiter
   * @returns {string[][]}
   */
  _parseCsv(text, delimiter) {
    const rows = []
    let row = []
    let field = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const c = text[i]

      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          field += c
        }
        continue
      }

      if (c === '"') {
        inQuotes = true
        continue
      }

      if (c === delimiter) {
        row.push(field)
        field = ''
        continue
      }

      if (c === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        continue
      }

      if (c === '\r') {
        // Handle standalone \r (old Mac) or CRLF; skip adding char
        if (text[i + 1] !== '\n') {
          row.push(field)
          rows.push(row)
          row = []
          field = ''
        }
        continue
      }

      field += c
    }

    // Flush last field/row
    if (field.length > 0 || row.length > 0) {
      row.push(field)
      rows.push(row)
    }

    // Drop trailing empty row from terminal newline, if any
    if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
      rows.pop()
    }

    return rows
  }
}
