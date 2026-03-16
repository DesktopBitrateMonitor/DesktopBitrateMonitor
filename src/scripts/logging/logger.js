class Logger {
  static mainWindow = null;

  static setMainWindow(windowInstance) {
    this.mainWindow = windowInstance;
  }

  static _timestamp() {
    const date = new Date();
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${(h < 10 ? '0' : '') + h}:${(m < 10 ? '0' : '') + m}:${(s < 10 ? '0' : '') + s} - ${(day < 10 ? '0' : '') + day}.${(month < 10 ? '0' : '') + month}.${year}`;
  }

  static _logTimeStamp(){
    return new Date();
  }

  static log(message) {
    const logMessage = `[LOG] ${this._timestamp()}: ${message}`;
    console.log(logMessage);
    const windowLog = { type: 'log', timestamp: this._logTimeStamp(), message: message };
    this._sendToMainWindow(windowLog);
  }

  static info(message) {
    const logMessage = `[INFO] ${this._timestamp()}: ${message}`;
    console.log(logMessage);
    const windowLog = { type: 'info', timestamp: this._logTimeStamp(), message: message };
    this._sendToMainWindow(windowLog);
  }

  static warn(message) {
    const logMessage = `[WARNING] ${this._timestamp()}: ${message}`;
    console.warn(logMessage);
    const windowLog = { type: 'warning', timestamp: this._logTimeStamp(), message: message };
    this._sendToMainWindow(windowLog);
  }

  static error(message) {
    const logMessage = `[ERROR] ${this._timestamp()}: ${message}`;
    console.error(logMessage);
    const windowLog = { type: 'error', timestamp: this._logTimeStamp(), message: message };
    this._sendToMainWindow(windowLog);
  }

  static success(message) {
    const logMessage = `[SUCCESS] ${this._timestamp()}: ${message}`;
    console.log(logMessage);
    const windowLog = { type: 'success', timestamp: this._logTimeStamp(), message: message };
    this._sendToMainWindow(windowLog);
  }

  static async _sendToMainWindow(message) {
    if (!this.mainWindow || this.mainWindow.isDestroyed() || !this.mainWindow.webContents) return;

    await this.mainWindow.webContents.send('log-message', message);
  }
}

export default Logger;
