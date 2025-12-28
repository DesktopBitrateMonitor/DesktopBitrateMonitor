import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * Minimal CSV writer with semicolon delimiter.
 * - Path is provided externally (not hard-coded)
 * - Writes optional headers once when creating a new file
 * - Escapes values that contain delimiter, quotes, or newlines
 */
export default class CsvWriter {
	/**
	 * @param {{ headers?: string[], delimiter?: string }} [options]
	 */
	constructor(options = {}) {
		const { headers = undefined, delimiter = ';' } = options
		this.headers = Array.isArray(headers) && headers.length ? [...headers] : undefined
		this.delimiter = delimiter
	}

	/**
	 * Append a single row (object-only) to the CSV at the provided path.
	 * If no headers were given in the constructor, the keys of the first row
	 * are used as headers and persisted for subsequent writes.
	 * @param {string} filePath - Absolute or relative path to the CSV file.
	 * @param {Record<string, any>} row - Object; keys map to headers order.
	 * @param {{ append?: boolean }} [options]
	 */
	writeRow(filePath, row, options = {}) {
		if (!filePath || typeof filePath !== 'string') {
			throw new Error('CsvWriter.writeRow: filePath must be a non-empty string')
		}
		if (row === null || typeof row !== 'object' || Array.isArray(row)) {
			throw new Error('CsvWriter.writeRow: row must be a non-null object')
		}
		const { append = true } = options

		// Ensure directory exists
		const dir = path.dirname(filePath)
		if (dir && dir !== '.' && !fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}

		const fileExists = fs.existsSync(filePath)
		const emptyFile = fileExists ? fs.statSync(filePath).size === 0 : true
		const flags = append ? 'a' : 'w'
		const stream = fs.createWriteStream(filePath, { flags, encoding: 'utf8' })

		// Initialize headers from row keys if none provided
		if (!this.headers) {
			this.headers = Object.keys(row)
		}

		// Write headers when file is new/empty or when overwriting
		if (this.headers && (emptyFile || flags === 'w')) {
			stream.write(this._formatRow(this.headers) + os.EOL)
		}

		const values = this.headers.map((h) => row?.[h])

		stream.write(this._formatRow(values) + os.EOL)
		stream.end()
	}

	/** No-op: streams are opened per call. */
	close() {}

	/**
	 * Convert an array of values into a CSV line string.
	 * @private
	 * @param {any[]} values
	 * @returns {string}
	 */
	_formatRow(values) {
		return values
			.map((v) => this._escapeValue(v))
			.join(this.delimiter)
	}

	/**
	 * Escape a single CSV value using RFC4180-like rules adapted for `;` delimiter.
	 * - Wrap in double quotes if it contains delimiter, quotes, or newlines
	 * - Escape inner quotes by doubling them
	 * @private
	 * @param {any} value
	 * @returns {string}
	 */
	_escapeValue(value) {
		let s = value == null ? '' : String(value)
		const needsQuoting =
			s.includes(this.delimiter) || s.includes('\n') || s.includes('\r') || s.includes('"')

		if (needsQuoting) {
			s = '"' + s.replaceAll('"', '""') + '"'
		}
		return s
	}
}

