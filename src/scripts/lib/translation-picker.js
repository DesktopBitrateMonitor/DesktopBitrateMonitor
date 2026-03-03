import { app } from 'electron';
import de from '../../renderer/src/translation/locals/de.json';
import en from '../../renderer/src/translation/locals/en.json';
import { readJsonData } from './json-reader';

const langs = { de, en };

const normalizeLocale = (locale) => (locale || 'en').toLowerCase().split('-')[0];

const pickLocale = (locale) => {
  const normalized = normalizeLocale(locale);
  return langs[normalized] || langs.en;
};

/**
 *
 * @param {String} lng - Language code (e.g., 'en', 'de'). If not provided, it will use the system's locale.
 * @param {String} key - The key to look up in the translation files.
 * @param {String} fallbackValue - A fallback value to return if the key is not found in the translation files.
 * @returns {String} - The translated string or the fallback value if the key is not found.
 */

export function getTranslationData({ lng, key, fallbackValue }) {
  const lang = pickLocale(lng ?? app?.getLocale?.());

  return readJsonData({ lng: lang, fallbackLng: langs.en, key, fallbackValue });
}
