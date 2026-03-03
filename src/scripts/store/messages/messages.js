import { app } from 'electron';
import generateId from '../../lib/id-generator';
import { readJsonData } from '../../lib/json-reader';
import de from '../../../renderer/src/translation/locals/de.json';
import en from '../../../renderer/src/translation/locals/en.json';

const langs = { de, en };

const normalizeLocale = (locale) => (locale || 'en').toLowerCase().split('-')[0];

const pickLocale = (locale) => {
  const normalized = normalizeLocale(locale);
  return langs[normalized] || langs.en;
};

const getMessage = (lng, key, fallbackValue) =>
  readJsonData({ lng, fallbackLng: langs.en, key, fallbackValue });

export const buildMessages = (locale) => {
  const lng = pickLocale(locale ?? app?.getLocale?.());
  const gm = (key, fallback) => getMessage(lng, key, fallback);

  return [
    {
      id: generateId(),
      group: 'global',
      action: 'global',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.global.success')
    },
    {
      id: generateId(),
      group: 'global',
      action: 'global',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.global.error')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'startStream',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.startStream.success')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'startStream',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.startStream.error')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'endStream',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.endStream.success')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'endStream',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.endStream.error')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'raid',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.raid.success')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'raid',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.raid.error')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'refreshStream',
      event: 'try',
      enabled: true,
      message: gm('defaults.messages.refreshStream.try')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'refreshStream',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.refreshStream.success')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'refreshStream',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.refreshStream.error')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'bitrate',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.bitrate.success')
    },
    {
      id: generateId(),
      group: 'stream',
      action: 'bitrate',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.bitrate.error')
    },
    {
      id: generateId(),
      group: 'switcher',
      action: 'switchScene',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.switchScene.success')
    },
    {
      id: generateId(),
      group: 'switcher',
      action: 'switchScene',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.switchScene.error')
    },
    {
      id: generateId(),
      group: 'switcher',
      action: 'setTrigger',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.setTrigger.success')
    },
    {
      id: generateId(),
      group: 'switcher',
      action: 'setTrigger',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.setTrigger.error')
    },
    {
      id: generateId(),
      group: 'switcher',
      action: 'setRTrigger',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.setRTrigger.success')
    },
    {
      id: generateId(),
      group: 'switcher',
      action: 'setRTrigger',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.setRTrigger.error')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'addAdmin',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.addAdmin.success')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'addAdmin',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.addAdmin.error')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'addAdmin',
      event: 'alreadyAdmin',
      enabled: true,
      message: gm('defaults.messages.addAdmin.alreadyAdmin')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'removeAdmin',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.removeAdmin.success')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'removeAdmin',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.removeAdmin.error')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'removeAdmin',
      event: 'notFound',
      enabled: true,
      message: gm('defaults.messages.removeAdmin.notFound')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'addMod',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.addMod.success')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'addMod',
      event: 'error',
      enabled: true,
      message: gm('defaults.messages.addMod.error')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'addMod',
      event: 'alreadyMod',
      enabled: true,
      message: gm('defaults.messages.addMod.alreadyMod')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'removeMod',
      event: 'success',
      enabled: true,
      message: gm('defaults.messages.removeMod.success')
    },
    {
      id: generateId(),
      group: 'user',
      action: 'removeMod',
      event: 'notFound',
      enabled: true,
      message: gm('defaults.messages.removeMod.notFound')
    }
  ];
};
