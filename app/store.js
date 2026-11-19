// Leonida Legend — saved progress and settings.
//
// Progress (the set of earned trophy names) and UI settings live in
// localStorage under versioned keys, so a player's checklist survives
// reloads without any server. Export writes the same set to a JSON file;
// import reads such a file back and keeps only names this guide knows.

const PROGRESS_KEY = 'leonida-legend.progress.v1';
const SETTINGS_KEY = 'leonida-legend.settings.v1';

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function loadProgress() {
  const raw = readJson(PROGRESS_KEY, []);
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((name) => typeof name === 'string'));
}

export function loadSettings() {
  const raw = readJson(SETTINGS_KEY, {});
  const sane = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return { spoilers: sane.spoilers === true, hideEarned: sane.hideEarned === true };
}

export function persistProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

export function persistSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function downloadProgress(game, earned) {
  const payload = JSON.stringify({ game, exported_at: new Date().toISOString(), earned: [...earned] }, null, 2);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function namesFromImportFile(parsed) {
  const names = Array.isArray(parsed) ? parsed : parsed?.earned;
  if (!Array.isArray(names)) throw new Error('no earned list in file');
  return names.filter((name) => typeof name === 'string');
}
