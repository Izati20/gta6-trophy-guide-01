// Tracker state for Leonida Legend: which trophies the reader has earned, kept in the browser's
// localStorage, with export to a JSON file and import back. Nothing leaves the browser.

const STORAGE_KEY = 'leonida-legend-earned-v1';

/** The earned trophy ids stored in this browser, as a Set of numbers (empty when none or unreadable). */
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

/** Persist the earned set (a Set of trophy ids) to localStorage. */
export function saveEarned(earned) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

/** Download the earned set as a JSON file the reader can keep or move to another browser. */
export function exportEarned(earned) {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Read an exported progress file (a bare array of ids, or an object with an "earned" array) into a Set of ids. */
export async function importEarned(file) {
  const data = JSON.parse(await file.text());
  const ids = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(ids)) throw new Error('not a Leonida Legend progress file');
  return new Set(ids.filter((n) => Number.isInteger(n)));
}
