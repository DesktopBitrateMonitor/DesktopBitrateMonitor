import { app, shell, BrowserWindow, ipcMain, screen, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import windowIcon from '../assets/icon.ico?asset';
import { injectDefaults } from '../scripts/store/defaults';
import Logger from '../scripts/logging/logger';
import { initializeElectronStoreIpc } from './ipc-handler/store-ipc-handler';
import { initializeUpdateIpc } from './ipc-handler/update-ipc-handler';
import { initializeAuthIpc } from './ipc-handler/auth-ipc-handler';
import { initializeLoggerIpc } from './ipc-handler/logger-ipc-handler';
import { initializeServices } from './lib/initialize-services';
import { initializeServicesIpc } from './ipc-handler/services-ipc-handler';
import '../scripts/app-server/server';

const { appConfig } = injectDefaults();

const config = appConfig.get('');

let mainWindow;
let tray = null;
let isQuitting = false;

// Ensure that only a single instance of the application is running
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

const autoCheckForUpdates = config.autoCheckForUpdates;
const autoInstallUpdates = config.autoInstallUpdates;
const shouldAutoInstallOnStart = autoCheckForUpdates && autoInstallUpdates;

autoUpdater.autoDownload = shouldAutoInstallOnStart;
autoUpdater.autoRunAppAfterInstall = true;
autoUpdater.autoInstallOnAppQuit = false;

if (shouldAutoInstallOnStart) {
  autoUpdater.on('update-available', (info) => {
    Logger.info(`Update available: ${info?.version}. Auto-install enabled, starting download.`);
  });

  autoUpdater.on('update-downloaded', () => {
    Logger.info('Update downloaded. Auto-install enabled, quitting to install.');
    isQuitting = true;
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    Logger.error(`Auto-update error: ${error?.message || error}`);
  });
}

function createWindow(displayIsAvailable = false) {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: config.size.width || 1200,
    height: config.size.height || 700,
    x: displayIsAvailable ? config.position.x : 0,
    y: displayIsAvailable ? config.position.y : 0,
    minWidth: 900,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    // titleBarStyle: 'hidden',
    title: `Desktop Bitrate Monitor (${app.getVersion()})`,
    icon: windowIcon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev
    }
  });

  // Let logger relay messages to the renderer window
  Logger.setMainWindow(mainWindow);

  mainWindow.on('ready-to-show', () => {
    // Automatically open DevTools in development mode
    if (is.dev) {
      try {
        mainWindow.webContents.openDevTools({ mode: 'undocked' });
      } catch (_) {
        // Fallback without options for older Electron versions
        mainWindow.webContents.openDevTools();
      }
    }

    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('resized', () => {
    const { width, height } = mainWindow.getBounds();
    appConfig.set('size.width', width);
    appConfig.set('size.height', height);
  });

  mainWindow.on('moved', () => {
    const { x, y } = mainWindow.getBounds();
    appConfig.set('position.x', x);
    appConfig.set('position.y', y);
    updateCurrentDisplay();
  });

  mainWindow.on('close', (e) => {
    const quitAction = appConfig.get('onQuit'); // 'minimize' or 'quit'

    if (!isQuitting && quitAction === 'minimize') {
      e.preventDefault();
      mainWindow.hide();
    } else {
      isQuitting = true;
    }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.on('second-instance', () => {
  if (mainWindow?.isDestroyed()) return createWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow?.show();
  mainWindow?.focus();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows

  const displayIsAvailable = checkDisplayIsAvailable(appConfig.get('screen.id'));

  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerIpcHandlers();
  createWindow(displayIsAvailable);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow.show();
  });

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      // TODO: implement language support
      label: 'Open',
      click: () => {
        if (mainWindow.isDestroyed()) {
          createWindow();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      // TODO: implement language support
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Desktop Bitrate Monitor');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (appConfig.get('onQuit') === 'quit') {
      app.quit();
    }
  }
});

function checkDisplayIsAvailable(screenId) {
  const displays = screen.getAllDisplays();
  const display = displays.find((display) => display.id === screenId);
  return display !== undefined;
}

function updateCurrentDisplay() {
  if (!mainWindow) return;

  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);

  if (!display) return;

  const currentId = appConfig.get('screen.id');
  if (currentId !== display.id) {
    appConfig.set('screen.id', display.id);
  }
}

async function registerIpcHandlers() {
  // Initialize IPC handlers
  await initializeElectronStoreIpc(ipcMain);
  await initializeAuthIpc(ipcMain);
  await initializeLoggerIpc(ipcMain);
  await initializeServicesIpc(ipcMain, mainWindow);
  await initializeUpdateIpc(ipcMain, mainWindow);

  // Initialize other services
  await initializeServices(mainWindow);
}
