// Leonida Legend — bootstrap.
//
// Loads data/trophies.json (a file beside this page, so the guide works
// fully offline), restores saved progress and settings, wires the toolbar,
// and paints the first list. Deep links preset the toolbar before the
// first paint: ?kind=, ?grade=, ?stage=, ?q=, ?spoilers=1 (used for the
// entry's screenshots), and ?demo=1 previews stage-1 story trophies as
// earned in memory only.

import { loadProgress, loadSettings, persistProgress, persistSettings, downloadProgress, namesFromImportFile } from './store.js';
import { applyUrlParams, paintList, paintStageCounts } from './view.js';

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;

const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const stageEl = document.getElementById('stage');
const spoilersEl = document.getElementById('spoilers');
const hideEarnedEl = document.getElementById('hide-earned');
const emptyEl = document.getElementById('empty');

let earned = loadProgress();
const settings = loadSettings();
spoilersEl.checked = settings.spoilers;
hideEarnedEl.checked = settings.hideEarned;

const demo = applyUrlParams(new URLSearchParams(location.search), settings);
spoilersEl.checked = settings.spoilers;
if (demo) {
  for (const trophy of trophies) {
    if (trophy.stage === 1 && trophy.kind === 'story') earned.add(trophy.name);
  }
}
// Deep-link scrolling for screenshots and shared links: ?scroll=<id>
// jumps to a section (e.g. list) after the first paint.
const scrollTarget = new URLSearchParams(location.search).get('scroll');

function render() {
  paintList(trophies, settings, earned, onToggle);
}

function onToggle(name, checked) {
  if (checked) earned.add(name);
  else earned.delete(name);
  if (!demo) persistProgress(earned);
  render();
}

paintStageCounts(trophies);

document.getElementById('export').addEventListener('click', () => {
  downloadProgress(data.game, earned);
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(namesFromImportFile(parsed).filter((name) => known.has(name)));
    persistProgress(earned);
    render();
  } catch {
    emptyEl.hidden = false;
    emptyEl.textContent = 'That file could not be imported as progress. Export from this page first, then import that file.';
  }
  event.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  earned = new Set();
  persistProgress(earned);
  render();
});

for (const el of [searchEl, kindEl, gradeEl, stageEl]) {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
}
spoilersEl.addEventListener('change', () => {
  settings.spoilers = spoilersEl.checked;
  persistSettings(settings);
  render();
});
hideEarnedEl.addEventListener('change', () => {
  settings.hideEarned = hideEarnedEl.checked;
  persistSettings(settings);
  render();
});

render();
if (scrollTarget) {
  const target = document.getElementById(scrollTarget);
  if (target) target.scrollIntoView();
}
