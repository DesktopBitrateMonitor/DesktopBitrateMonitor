import { app, shell, BrowserWindow, ipcMain, screen, Tray, Menu } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import windowIcon from '../assets/icon.ico?asset';
import { injectDefaults } from '../scripts/store/defaults';
import { initializeElectronStoreIpc } from './ipc-handler/store-ipc-handler';
import { initializeUpdateIpc } from './ipc-handler/update-ipc-handler';
import { initializeAuthIpc } from './ipc-handler/auth-ipc-handler';

const { appConfig } = injectDefaults();

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow(displayIsAvailable = false) {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: appConfig.get('size.width') || 1200,
    height: appConfig.get('size.height') || 700,
    x: displayIsAvailable ? appConfig.get('position.x') : 0,
    y: displayIsAvailable ? appConfig.get('position.y') : 0,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: `Desktop-Bitrate-Monitor_v2 (${app.getVersion()})`,
    icon: windowIcon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev
    }
  });

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
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
  tray.setToolTip('Desktop Bitrate Monitor v2');
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
  await initializeElectronStoreIpc(ipcMain);
  await initializeUpdateIpc(ipcMain);
  await initializeAuthIpc(ipcMain);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
