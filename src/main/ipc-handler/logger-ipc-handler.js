import Logger from '../../scripts/logging/logger';
import CsvWriter from '../../scripts/lib/csv-writer';
import CsvReader from '../../scripts/lib/csv-reader';
import { dialog } from 'electron';

let isLoggerIpcInitialized = false;

export async function initializeLoggerIpc(ipcMain) {
  if (isLoggerIpcInitialized) {
    Logger.warn('Logger IPC already initialized, skipping...');
    return;
  }

  const writer = new CsvWriter();
  const reader = new CsvReader();

  isLoggerIpcInitialized = true;
  Logger.log('Registering Logger IPC Handlers');

  ipcMain.handle('create-log-file', (event, fullPath, content) => {
    return writer.writeRow(fullPath, content);
  });

  ipcMain.handle('read-log-file', (event, fullPath) => {
    console.log('IPC read-log-file called with:', fullPath);
    return reader.read(fullPath);
  });

  ipcMain.handle('open-file-dialog', (event, options) => {
    try {
      const res = dialog.showOpenDialog(options);
      return res;
    } catch (error) {
      Logger.error(`Error in open-file-dialog IPC handler: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-log-file-size-mb', (event, fullPath) => {
    // return fileHandler.getFileSizeInMB(fullPath);
  });
}
