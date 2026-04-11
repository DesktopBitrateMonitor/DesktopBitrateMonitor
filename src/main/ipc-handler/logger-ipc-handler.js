import fs from 'fs';
import Logger from '../../scripts/logging/logger';
import { FeedLogger } from '../../scripts/logging/feed-logger';
import { dialog } from 'electron';

import { injectDefaults } from '../../scripts/store/defaults';
import { getStreams as getKickStreams } from '../../scripts/kick/kick-api';
import { getStreams as getTwitchStreams } from '../../scripts/twitch/twitch-api';

const { loggingConfig, appConfig, twitchAccountsConfig, kickAccountsConfig } = injectDefaults();

let isLoggerIpcInitialized = false;
let sessionFeedLogger = null;
let sessionFeedLoggerKey = null;
let actionsFeedLogger = null;
let actionsFeedLoggerKey = null;

function getSessionFeedLogger({ dir, baseName, maxSizeMB }) {
  const normalizedMaxSizeMB = Number(maxSizeMB) || 5;
  const loggerKey = `${dir}|${baseName}|${normalizedMaxSizeMB}`;

  if (!sessionFeedLogger || sessionFeedLoggerKey !== loggerKey) {
    sessionFeedLogger = new FeedLogger({
      dir,
      baseName: `feed-log-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      maxFileSize: normalizedMaxSizeMB * 1024 * 1000,
      bufferSize: 1
    });
    sessionFeedLoggerKey = loggerKey;
  }

  return sessionFeedLogger;
}

function getActionsFeedLogger({ dir, baseName, maxSizeMB }) {
  const normalizedMaxSizeMB = Number(maxSizeMB) || 5;
  const loggerKey = `${dir}|${baseName}|${normalizedMaxSizeMB}`;

  if (!actionsFeedLogger || actionsFeedLoggerKey !== loggerKey) {
    actionsFeedLogger = new FeedLogger({
      dir,
      baseName: `feed-log-${new Date().toISOString().replace(/[:.]/g, '-')}`,
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

  ipcMain.handle('open-file-dialog', async (event, options) => {
    try {
      const res = await dialog.showOpenDialog(options);
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

  const apiCallsFunctions = {
    kick: getKickStreams,
    twitch: getTwitchStreams
  };

  const configMapping = {
    kick: kickAccountsConfig,
    twitch: twitchAccountsConfig
  };

  ipcMain.handle('write-to-session-log-file', async (event, content) => {
    if (!content) return { success: false, message: 'Missing content to write' };

    const loggingSettings = loggingConfig.get('');
    const activePlatform = appConfig.get('activePlatform');
    const loggingEnabled = loggingSettings.logSessions;
    const sessionLogsPath = loggingSettings.sessionLogsPath;

    if (!loggingEnabled)
      return { success: false, message: 'Session logging is disabled in settings' };
    if (!sessionLogsPath)
      return { success: false, message: 'Session logs path is not set in settings' };

    const config = configMapping[activePlatform];
    const apiFn = apiCallsFunctions[activePlatform];

    const access_token = config.get('broadcaster.access_token');
    const broadcaster_user_id = config.get('broadcaster.id');
    const streamInfo = {
      channel_Id: '',
      title: '',
      directory: '',
      channel_Id: '',
      title: '',
      directory: '',
      directory_thumbnail: ''
    };

    if (Boolean(access_token)) {
      const streamData = await apiFn(access_token, broadcaster_user_id);

      streamInfo.channel_Id = streamData.channel_Id;
      streamInfo.title = streamData.title;
      streamInfo.directory = streamData.directory;
      streamInfo.directory_thumbnail = streamData.directory_thumbnail;
    }

    const mergedContent = [...content].map((entry) => ({
      ...entry,
      channel_Id: streamInfo.channel_Id,
      title: streamInfo.title,
      directory: streamInfo.directory,
      directory_thumbnail: streamInfo.directory_thumbnail
    }));

    try {
      const feedLogger = getSessionFeedLogger({
        dir: sessionLogsPath,
        maxSizeMB: loggingSettings.sessionLogsFileSize
      });

      const entries = Array.isArray(mergedContent) ? mergedContent : [mergedContent];

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

  ipcMain.handle('read-session-log-file', async (event, options) => {
    try {
      const res = await dialog.showOpenDialog(options);

      if (res.canceled || res.filePaths.length === 0) {
        return { success: false, message: 'No file selected' };
      }

      // read .jsonl file and parse each line as JSON
      const filePath = res.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
      const parsedEntries = lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          Logger.error(`Error parsing line in log file: ${err.message}`);
          return null;
        }
      });

      return { success: true, data: parsedEntries };
    } catch (error) {
      Logger.error(`Error in read-session-log-file IPC handler: ${error.message}`);
      return { success: false, error: error.message };
    }
  });
}
