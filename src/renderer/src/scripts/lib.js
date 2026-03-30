import Logger from '../../../scripts/logging/logger';

export async function storeLayoutChanges({ layout, key }) {
  if (!layout || !key) {
    throw new Error('Layout and key are required to store layout changes.');
  }

  try {
    await window.storeApi.set('app-config', `layout.settings.layout.${key}.layout`, layout);
    return {
      success: true,
      message: { msg: 'Layout changes stored successfully.', severity: 'success' }
    };
  } catch (error) {
    Logger.error(`Failed to store layout changes: ${error.message}`);
    return {
      success: false,
      message: { msg: `Failed to store layout changes: ${error.message}`, severity: 'error' }
    };
  }
}

export function timestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export async function stringifyBackupData(data) {
  const encodedData = btoa(JSON.stringify(data));
  return encodedData;
}

export async function parseBackupData(encodedData) {
  const decodedData = atob(encodedData);
  return JSON.parse(decodedData);
}
