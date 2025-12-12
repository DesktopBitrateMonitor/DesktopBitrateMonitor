import Logger from '../../../scripts/logger';

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
    Logger.error('Failed to store layout changes:', error);
    return {
      success: false,
      message: { msg: 'Failed to store layout changes: ' + error.message, severity: 'error' }
    };
  }
}
