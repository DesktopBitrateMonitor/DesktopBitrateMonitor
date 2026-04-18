export const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const durationToRoundedSeconds = (ms) => Math.max(0, Math.round(ms / 1000));

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const EMPTY_SCENE_KEY = '__no_software_data__';
const EMPTY_SCENE_LABEL = 'no software data';

const normalizeScene = (scene) => String(scene || '').trim().toLowerCase();

const getSceneKey = (scene) => {
  const normalized = normalizeScene(scene);
  return normalized || EMPTY_SCENE_KEY;
};

const getSceneLabel = (scene) => {
  const label = String(scene || '').trim();
  return label || EMPTY_SCENE_LABEL;
};

const getRepresentativeStep = (logs) => {
  if (logs.length < 2) {
    return 1000;
  }

  const diffs = [];
  for (let i = 0; i < logs.length - 1; i += 1) {
    const diff = Math.max(0, logs[i + 1]._ts - logs[i]._ts);
    if (diff > 0) {
      diffs.push(diff);
    }
  }

  if (diffs.length === 0) {
    return 1000;
  }

  const sorted = diffs.sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] || 1000;
};

const sceneSwitches = (logs) => {
  const switches = {};

  for (let i = 1; i < logs.length; i += 1) {
    const previousScene = getSceneKey(logs[i - 1]?.currentScene);
    const currentScene = getSceneKey(logs[i]?.currentScene);

    if (currentScene !== previousScene) {
      switches[currentScene] = (switches[currentScene] || 0) + 1;
    }
  }

  return switches;
};

export const computeStats = (logs) => {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const activeLogs = safeLogs.filter((log) => toSafeNumber(log.bitrate, 0) > 0);
  const switches = sceneSwitches(safeLogs);

  const sceneDurations = {};
  const lastStep = getRepresentativeStep(activeLogs);

  for (let i = 0; i < activeLogs.length; i += 1) {
    const current = activeLogs[i];
    const next = activeLogs[i + 1];
    const segmentMs = next ? Math.max(0, next._ts - current._ts) : lastStep;
    const sceneKey = getSceneKey(current?.currentScene);

    if (!sceneDurations[sceneKey]) {
      sceneDurations[sceneKey] = {
        sceneKey,
        sceneName: getSceneLabel(current?.currentScene),
        duration: 0
      };
    }

    sceneDurations[sceneKey].duration += segmentMs;
  }

  const sceneDurationEntries = Object.entries(sceneDurations)
    .map(([sceneKey, entry]) => ({
      sceneKey,
      sceneName: entry.sceneName,
      duration: entry.duration,
      switchCount: switches[sceneKey] || 0
    }))
    .sort((a, b) => b.duration - a.duration);

  const fullUptimeMs =
    sceneDurationEntries.reduce(
      (total, entry) => total + durationToRoundedSeconds(entry.duration),
      0
    ) * 1000;

  return {
    fullUptimeMs,
    sceneDurationEntries
  };
};
