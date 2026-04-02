import fs from 'fs';
import Logger from '../../scripts/logging/logger';
import { FeedLogger } from '../../scripts/logging/feed-logger';
import { dialog } from 'electron';

import { injectDefaults } from '../../scripts/store/defaults';

const { loggingConfig } = injectDefaults();

let isLoggerIpcInitialized = false;
let sessionFeedLogger = null;
let sessionFeedLoggerKey = null;
let actionsFeedLogger = null;
let actionsFeedLoggerKey = null;



function getSessionFeedLogger({ dir, baseName, format, maxSizeMB }) {
  const normalizedMaxSizeMB = Number(maxSizeMB) || 5;
  const loggerKey = `${dir}|${baseName}|${format}|${normalizedMaxSizeMB}`;

  if (!sessionFeedLogger || sessionFeedLoggerKey !== loggerKey) {
    sessionFeedLogger = new FeedLogger({
      dir,
      baseName: `feed-log-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      format: format || 'ndjson',
      maxFileSize: normalizedMaxSizeMB * 1024 * 1000,
      bufferSize: 1
    });
    sessionFeedLoggerKey = loggerKey;
  }

  return sessionFeedLogger;
}

function getActionsFeedLogger({ dir, baseName, format, maxSizeMB }) {
  const normalizedMaxSizeMB = Number(maxSizeMB) || 5;
  const loggerKey = `${dir}|${baseName}|${format}|${normalizedMaxSizeMB}`;

  if (!actionsFeedLogger || actionsFeedLoggerKey !== loggerKey) {
    actionsFeedLogger = new FeedLogger({
      dir,
      baseName: `feed-log-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      format: format || 'ndjson',
      maxFileSize: normalizedMaxSizeMB * 1024 * 1000,
      bufferSize: 1
    });
    actionsFeedLoggerKey = loggerKey;
  }

  return actionsFeedLogger;
}

export async function initializeLoggerIpc(ipcMain) {
  if (isLoggerIpcInitialized) {
    Logger.warn('Logger IPC already initialized, skipping...');
    return;
  }

  isLoggerIpcInitialized = true;
  Logger.log('Initializing Logger IPC');

  ipcMain.handle('create-log-file', (event, type, fullPath, content) => {
    if (!type || !fullPath || !content) {
      Logger.error('Missing parameters for create-log-file IPC handler');
      return { success: false, message: 'Missing parameters' };
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

  ipcMain.handle('write-to-session-log-file', (event, content) => {
    if (!content) return { success: false, message: 'Missing content to write' };

    const loggingSettings = loggingConfig.get('');
    const loggingEnabled = loggingSettings.logSessions;
    const sessionLogsPath = loggingSettings.sessionLogsPath;

    if (!loggingEnabled)
      return { success: false, message: 'Session logging is disabled in settings' };
    if (!sessionLogsPath)
      return { success: false, message: 'Session logs path is not set in settings' };

    try {
      const feedLogger = getSessionFeedLogger({
        dir: sessionLogsPath,
        format: loggingSettings.sessionLogsFormat,
        maxSizeMB: loggingSettings.sessionLogsFileSize
      });

      const entries = Array.isArray(content) ? content : [content];

      feedLogger.write(entries);

      return { success: true, message: 'Content written successfully' };
    } catch (error) {
      Logger.error(`Error in write-to-session-log-file IPC handler: ${error.message}`);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('write-to-actions-log-file', (event, content) => {
    if (!content) return { success: false, message: 'Missing content to write' };

    const loggingSettings = loggingConfig.get('');
    const loggingEnabled = loggingSettings.logActions;
    const actionsLogsPath = loggingSettings.actionsLogsPath;

    if (!loggingEnabled)
      return { success: false, message: 'Actions logging is disabled in settings' };
    if (!actionsLogsPath)
      return { success: false, message: 'Actions logs path is not set in settings' };

    try {
      const feedLogger = getActionsFeedLogger({
        dir: actionsLogsPath,
        format: loggingSettings.actionsLogsFormat,
        maxSizeMB: loggingSettings.actionsLogsFileSize
      });

      const entries = Array.isArray(content) ? content : [content];

      feedLogger.write(entries);

      return { success: true, message: 'Content written successfully' };
    } catch (error) {
      Logger.error(`Error in write-to-actions-log-file IPC handler: ${error.message}`);
      return { success: false, error: error.message };
    }
  });
}
