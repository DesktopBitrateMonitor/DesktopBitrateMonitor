import de from '../../renderer/src/translation/locals/de.json';
import en from '../../renderer/src/translation/locals/en.json';
import { readJsonData } from './json-reader';

const langs = { de, en };

const normalizeLocale = (locale) => (locale || 'en').toLowerCase().split('-')[0];

const pickLocale = (locale) => {
  const normalized = normalizeLocale(locale);
  return langs[normalized] || langs.en;
};

// Resolve the best available locale in both main and renderer contexts.
const resolveSystemLocale = () => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }

  try {
    // In the main process Electron is available; in renderer this will throw and fall back.
    // eslint-disable-next-line global-require
    const { app } = require('electron');
    return app?.getLocale?.();
  } catch (_error) {
    return undefined;
  }
};

/**
 *
 * @param {String} lng - Language code (e.g., 'en', 'de'). If not provided, it will use the system's locale.
 * @param {String} key - The key to look up in the translation files.
 * @param {String} fallbackValue - A fallback value to return if the key is not found in the translation files.
 * @returns {String} - The translated string or the fallback value if the key is not found.
 */

export function getTranslationData({ lng, key, fallbackValue }) {
  const lang = pickLocale(lng ?? resolveSystemLocale());

  return readJsonData({ lng: lang, fallbackLng: langs.en, key, fallbackValue });
}
