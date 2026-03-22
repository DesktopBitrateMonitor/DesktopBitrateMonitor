import Logger from "../logging/logger";
import { injectDefaults } from "../store/defaults";
import { getCurrentProgramScene } from "../streaming-software/obs-api";

const { switcherConfig, streamingSoftwareConfig } = injectDefaults();

export const ifCurrentSceneIsPrivacyScene = async () => {
  const currentSoftware = streamingSoftwareConfig.get('currentType');

  let sceneData;

  if (currentSoftware === 'obs-studio') {
    sceneData = await getCurrentProgramScene();
  }

  if (!sceneData.success) {
    Logger.error(`Failed to get current scene: ${sceneData.error}`);
    return;
  }
  const currentScene = sceneData?.data?.currentProgramSceneName || '';
  const privacyScene = switcherConfig.get('scenePrivacy');

  const inPrivacyScene = currentScene.toLowerCase() === privacyScene.toLowerCase();
  return inPrivacyScene;
};
