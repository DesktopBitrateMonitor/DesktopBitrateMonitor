import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../translation';
import { useAppConfigStore } from './DataContext';

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' }
];

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { appConfig, updateAppConfig } = useAppConfigStore();
  const [language, setLanguage] = useState(appConfig?.language || i18n.language || 'en');

  useEffect(() => {
    if (appConfig?.language && appConfig.language !== language) {
      i18n.changeLanguage(appConfig.language);
    }
  }, [appConfig?.language, language]);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setLanguage(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const changeLanguage = useCallback(
    async (nextLanguage) => {
      if (!nextLanguage || nextLanguage === language) {
        return { success: true, language: nextLanguage ?? language };
      }
      try {
        await i18n.changeLanguage(nextLanguage);
        updateAppConfig?.((prev) => ({
          ...(prev || {}),
          language: nextLanguage
        }));

        if (typeof window !== 'undefined' && window?.storeApi?.set) {
          await window.storeApi.set('app-config', 'language', nextLanguage);
        }

        const meta = AVAILABLE_LANGUAGES.find((lang) => lang.code === nextLanguage);
        return { success: true, language: nextLanguage, meta };
      } catch (error) {
        console.error('Failed to change language', error);
        return { success: false, error };
      }
    },
    [language, updateAppConfig]
  );

  const value = useMemo(
    () => ({
      language,
      supportedLanguages: AVAILABLE_LANGUAGES,
      changeLanguage
    }),
    [language, changeLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
