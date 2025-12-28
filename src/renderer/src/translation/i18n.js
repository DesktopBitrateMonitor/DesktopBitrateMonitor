import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import en from './locals/en.json';
import de from './locals/de.json';

const resources = {
  en: { translation: en },
  de: { translation: de }
};

i18n.use(Backend).use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'de'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false
  },
  backend: {
    loadPath: './locals/{{lng}}.json'
  }
});

export default i18n;