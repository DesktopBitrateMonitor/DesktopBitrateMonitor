import { shell } from 'electron';
import { startAuthorization } from '../../scripts/twitch/auth-server';

export async function initializeAuthIpc(ipcMain) {
  ipcMain.on('start-auth-process', () => {
    const url = startAuthorization();
    shell.openExternal(url);
  });
}
