import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  bitrate: number;
  speed: number;
  uptime: number;
  totalUptime: number;
  timestamp: number;
}

interface FeedLoggerOptions {
  dir?: string;
  baseName?: string;
  maxFileSize?: number;
  bufferSize?: number;
}

export class FeedLogger {
  private dir: string;
  private baseName: string;
  private maxFileSize: number;
  private bufferSize: number;

  private buffer: LogEntry[] = [];
  private currentFile: string;

  constructor(options: FeedLoggerOptions = {}) {
    this.dir = options.dir || './logs';
    this.baseName = options.baseName || 'log';
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
    this.bufferSize = options.bufferSize || 50;

    this.ensureDir();
    this.currentFile = this.getCurrentFile();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  private getFilePath(index: number): string {
    return path.join(this.dir, `${this.baseName}_${index}.jsonl`);
  }

  private getCurrentFile(): string {
    let index = 1;

    while (true) {
      const filePath = this.getFilePath(index);

      if (!fs.existsSync(filePath)) {
        return filePath;
      }

      const size = fs.statSync(filePath).size;
      if (size < this.maxFileSize) {
        return filePath;
      }

      index++;
    }
  }

  public log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  public write(entries: LogEntry | LogEntry[]): void {
    const normalizedEntries = Array.isArray(entries) ? entries : [entries];

    if (normalizedEntries.length === 0) return;

    const data = this.serializeEntries(normalizedEntries);
    this.rotateFileIfNeeded(Buffer.byteLength(data, 'utf-8'));
    fs.appendFileSync(this.currentFile, data, 'utf-8');
  }

  private rotateFileIfNeeded(incomingSize = 0): void {
    const size = fs.existsSync(this.currentFile) ? fs.statSync(this.currentFile).size : 0;

    if (size + incomingSize >= this.maxFileSize) {
      this.currentFile = this.getCurrentFile();
    }
  }

  private serializeEntries(entries: LogEntry[]): string {
    return entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  }

  public flush(): void {
    if (this.buffer.length === 0) return;

    this.write(this.buffer);
    this.buffer = [];
  }

  public close(): void {
    this.flush();
  }
}
