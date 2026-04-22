const isArray = (value) => Array.isArray(value);

export default function migrateActivePlatforms(appConfig) {
  const activePlatform = appConfig.get('activePlatform');
  const activePlatforms = appConfig.get('activePlatforms');

  if (activePlatform) {
    appConfig.set('activePlatforms', [activePlatform]);
  }

  appConfig.delete('activePlatform');
}
