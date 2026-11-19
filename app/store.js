// Leonida Legend — saved progress and preferences.
//
// The earned set (trophy names) and the two toggles live in
// localStorage under versioned keys, so a player's checklist survives
// reloads without any server. Export writes the same set to a JSON
// file; import reads such a file back and keeps only names this guide
// knows.

const EARNED_KEY = 'leonida-legend-v2.earned';
const PREFS_KEY = 'leonida-legend-v2.prefs';

function parseStored(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function readEarned() {
  const raw = parseStored(EARNED_KEY, []);
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((name) => typeof name === 'string'));
}

export function readPrefs() {
  const raw = parseStored(PREFS_KEY, {});
  const sane = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return { spoilers: sane.spoilers === true, hideEarned: sane.hideEarned === true };
}

export function writeEarned(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

export function writePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function earnedFileText(game, earned) {
  return JSON.stringify({ game, exported_at: new Date().toISOString(), earned: [...earned] }, null, 2);
}

export function downloadEarned(game, earned) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([earnedFileText(game, earned)], { type: 'application/json' }));
  anchor.download = 'leonida-legend-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function parseEarnedFile(parsed) {
  const names = Array.isArray(parsed) ? parsed : parsed?.earned;
  if (!Array.isArray(names)) throw new Error('no earned list in file');
  return names.filter((name) => typeof name === 'string');
}
