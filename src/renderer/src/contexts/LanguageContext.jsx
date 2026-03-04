import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../translation';
import { useAppConfigStore, useCommandsConfigStore, useMessagesConfigStore } from './DataContext';
import { getTranslationData } from '../../../scripts/lib/translation-picker';

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' }
];

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { appConfig, updateAppConfig } = useAppConfigStore();
  const { commandsConfig, updateCommandsConfig } = useCommandsConfigStore();
  const { messagesConfig, updateMessagesConfig } = useMessagesConfigStore();
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

        // Change the language for the config files.
        // This has to be done because the search function looks for the label and the values
        const [commandsLanguageData, messagesLanguageData] = await Promise.all([
          getTranslationData({
            lng: nextLanguage,
            key: 'platforms.commands'
          }),
          getTranslationData({
            lng: nextLanguage,
            key: 'platforms.messages'
          })
        ]);

        if (messagesLanguageData && commandsLanguageData) {
          const messagesList = Array.isArray(messagesConfig?.messages) ? messagesConfig.messages : [];
          const commandsList = Array.isArray(commandsConfig?.commands) ? commandsConfig.commands : [];
          
          const updatedMessages = messagesList.map((msg) => ({
            ...msg,
            label: messagesLanguageData[msg.action]?.[msg.event]?.label || msg.label
          }));
          updateMessagesConfig?.((prev) => ({
            ...(prev || {}),
            messages: updatedMessages
          }));

          const updatedCommands = commandsList.map((cmd) => ({
            ...cmd,
            label: commandsLanguageData[cmd.action]?.label || cmd.label
          }));
          updateCommandsConfig?.((prev) => ({
            ...(prev || {}),
            commands: updatedCommands
          }));

          await window.storeApi.set('messages-config', 'messages', updatedMessages);
          await window.storeApi.set('commands-config', 'commands', updatedCommands);
        }

        const meta = AVAILABLE_LANGUAGES.find((lang) => lang.code === nextLanguage);
        return { success: true, language: nextLanguage, meta };
      } catch (error) {
        console.error('Failed to change language', error);
        return { success: false, error };
      }
    },
    [
      language,
      updateAppConfig,
      commandsConfig,
      updateCommandsConfig,
      messagesConfig,
      updateMessagesConfig
    ]
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
