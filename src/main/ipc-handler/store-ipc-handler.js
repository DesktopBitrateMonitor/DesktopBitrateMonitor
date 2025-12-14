import Logger from '../../scripts/logger';
import { injectDefaults } from '../../scripts/store/defaults';

const {
  appConfig,
  loggingConfig,
  commandsConfig,
  messagesConfig,
  accountsConfig,
  serverConfig,
  streamingSoftwareConfig,
  switcherConfig
} = injectDefaults();

// Map store names to their instances for ipc usage
const STORES = {
  'app-config': appConfig,
  'logging-config': loggingConfig,
  'commands-config': commandsConfig,
  'messages-config': messagesConfig,
  'accounts-config': accountsConfig,
  'server-config': serverConfig,
  'streaming-software-config': streamingSoftwareConfig,
  'switcher-config': switcherConfig
};

// Helper function to get a store by name
const getStore = (name) => {
  if (name.endsWith('.json')) {
    name = name.replace('.json', '');
  }

  if (!Object.keys(STORES).includes(name)) {
    Logger.error(`Store not found:`, name);
    return null;
  }
  return STORES[name];
};

let storeIpcInitialized = false;

export async function initializeElectronStoreIpc(ipcMain) {
  if (storeIpcInitialized) {
    Logger.warn('Electron Store IPC already initialized, skipping...');
    return;
  }

  Logger.info(`Initializing Electron Store IPC`);
  storeIpcInitialized = true;

  ipcMain.handle('electron-store:set', (event, file, key, value) => {
    const store = getStore(file);
    if (store) {
      store.set(key, value);
      return { success: true };
    }
    return { success: false };
  });
  ipcMain.handle('electron-store:get', (event, file, key) => {
    const store = getStore(file);
    if (store) {
      return store.get(key);
    }
    return null;
  });
  ipcMain.handle('electron-store:delete', (event, file, key) => {
    const store = getStore(file);
    if (store) {
      store.delete(key);
      return { success: true };
    }
    return { success: false };
  });
  ipcMain.handle('electron-store:reset', (event, file, key) => {
    const store = getStore(file);
    if (store) {
      store.reset(key);
      return { success: true };
    }
    return { success: false };
  });
}
