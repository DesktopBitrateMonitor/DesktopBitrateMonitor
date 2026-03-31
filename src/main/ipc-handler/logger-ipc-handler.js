import fs from 'fs';
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
  Logger.log('Initializing Logger IPC');

  ipcMain.handle('create-log-file', (event, type, fullPath, content) => {
    if (!type || !fullPath || !content) {
      Logger.error('Missing parameters for create-log-file IPC handler');
      return { success: false, message: 'Missing parameters' };
    }

    if (type === 'csv') {
      return writer.writeRow(fullPath, content);
    }
    if (type === 'txt') {
      const txtContent = content
        .map((log) => `${log.date} - ${log.time}: ${log.message}`)
        .join('\n');
      fs.writeFileSync(fullPath, txtContent);

      return { success: true, message: 'File created successfully' };
    }
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

  ipcMain.handle('save-file-dialog', (event, options) => {
    try {
      const res = dialog.showSaveDialog(options);
      return res;
    } catch (error) {
      Logger.error(`Error in save-file-dialog IPC handler: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-log-file-size-mb', (event, fullPath) => {
    const stats = fs.statSync('C:\\Users\\ProbstR54392\\OneDrive - AMAG\\Desktop\\exampe.json');
    console.log(stats);
    return {
      success: true,
      data: { stats, sizeBytes: stats.size, sizeMB: stats.size / (1024 * 1000) }
    };
    // return fileHandler.getFileSizeInMB(fullPath);
  });
}
