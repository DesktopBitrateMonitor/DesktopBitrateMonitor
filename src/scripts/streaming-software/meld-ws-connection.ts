import { WebSocket } from 'ws';

export interface MeldMessage {
  type: string;
  [key: string]: unknown;
}

export type MeldMessageHandler = (message: MeldMessage) => void;

interface MeldWsConnectionOptions {
  host: string;
  port: number;
  reconnecting?: boolean;
  reconnectDelaySeconds?: number;
}

export class MeldWsConnection {
  private ws: WebSocket | null = null;
  private host: string;
  private port: number;
  private reconnectDelaySeconds: number;

  private _isConnected = false;
  private _isReconnecting = false;
  private reconnecting = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private messageHandlers: Set<MeldMessageHandler> = new Set();
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onReconnectingCallback: ((attempt: number, nextInSeconds: number) => void) | null = null;

  constructor(options: MeldWsConnectionOptions) {
    this.host = options.host;
    this.port = options.port;
    this.reconnecting = options.reconnecting ?? false;
    this.reconnectDelaySeconds = options.reconnectDelaySeconds ?? 5;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isReconnecting(): boolean {
    return this._isReconnecting;
  }

  // ── Event hooks ────────────────────────────────────────────────────────────

  onConnect(cb: () => void): this {
    this.onConnectCallback = cb;
    return this;
  }

  onDisconnect(cb: () => void): this {
    this.onDisconnectCallback = cb;
    return this;
  }

  onReconnecting(cb: (attempt: number, nextInSeconds: number) => void): this {
    this.onReconnectingCallback = cb;
    return this;
  }

  /** Register a handler for incoming messages. Returns an unsubscribe function. */
  onMessage(handler: MeldMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  connect(): Promise<void> {
    if (this._isConnected) return Promise.resolve();
    return this._openSocket();
  }

  /** Send a message to Meld Studio. Throws if not connected. */
  send(message: MeldMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('MeldWsConnection: cannot send — socket is not open');
    }
    const payload = JSON.stringify(message);
    this.ws.send(payload);
  }

  /** Start the auto-reconnect loop. */
  reconnect(): void {
    if (this._isReconnecting || this._isConnected || this.destroyed) return;
    this._scheduleReconnect();
  }

  /** Permanently close the connection and stop any reconnect loop. */
  close(): void {
    this.destroyed = true;
    this._isReconnecting = false;
    this.reconnecting = false;
    this._clearReconnectTimer();

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this._isConnected = false;
    console.log('Meld Studio WebSocket connection closed');
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.host}:${this.port}`;
      console.log(`Connecting to Meld Studio at ${url}`);

      const ws = new WebSocket(url);
      this.ws = ws;

      ws.once('open', () => {
        this._isConnected = true;
        this._isReconnecting = false;
        this.reconnectAttempts = 0;
        console.log('Connected to Meld Studio');
        this.onConnectCallback?.();
        resolve();
      });

      ws.once('error', (err) => {
        console.error(`Meld Studio WebSocket error: ${err.message}`);
        if (!this._isConnected) {
          reject(err);
        }
      });

      ws.once('close', () => {
        const wasConnected = this._isConnected;
        this._isConnected = false;
        this.ws = null;

        if (wasConnected) {
          // console.info('Meld Studio WebSocket disconnected');
          this.onDisconnectCallback?.();
        }

        if (!this.destroyed) {
          if (this._isReconnecting) {
            this._attemptReconnect();
          } else {
            this._scheduleReconnect();
          }
        }
      });

      ws.on('message', (raw) => {
        this._handleIncoming(raw.toString());
      });
    });
  }

  private _handleIncoming(raw: string): void {
    let message: MeldMessage;
    try {
      message = JSON.parse(raw) as MeldMessage;
    } catch {
      console.warn(`Meld Studio: received non-JSON message: ${raw}`);
      return;
    }

    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (err) {
        console.error(`Meld Studio message handler threw: ${err}`);
      }
    }
  }

  private _scheduleReconnect(): void {
    if (this.destroyed || this._isReconnecting || !this.reconnecting) return;
    this._isReconnecting = true;
    this._attemptReconnect();
  }

  private _attemptReconnect(): void {
    if (this.destroyed || this._isConnected || !this.reconnecting) {
      this._isReconnecting = false;
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelaySeconds;

    console.info(
      `Meld Studio reconnect attempt #${this.reconnectAttempts} — next try in ${delay}s`
    );
    this.onReconnectingCallback?.(this.reconnectAttempts, delay);

    this.reconnectTimer = setTimeout(async () => {
      if (this.destroyed || this._isConnected) {
        this._isReconnecting = false;
        return;
      }

      try {
        await this._openSocket();
      } catch {
        // _openSocket schedules the next attempt via the 'close' handler
      }
    }, delay * 1000);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
