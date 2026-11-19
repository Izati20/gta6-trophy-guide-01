// Leonida Legend — bootstrap.
//
// Loads data/trophies.json (a file beside this page, so the guide works
// fully offline), restores saved progress and preferences, applies the
// deep link before the first paint, wires the filter bar, and renders.
// Deep links: ?kind=, ?grade=, ?stage=, ?q=, ?spoilers=1 (used for the
// entry's screenshots), and ?demo=1 previews stage-1 story trophies as
// earned in memory only.

import { readEarned, readPrefs, writeEarned, writePrefs, downloadEarned, parseEarnedFile } from './store.js';
import { readDeepLink, renderCards, renderStageTotals } from './view.js';

const response = await fetch('data/trophies.json');
const data = await response.json();
const trophies = data.trophies;

const qEl = document.getElementById('q');
const kindEl = document.getElementById('kindSel');
const gradeEl = document.getElementById('gradeSel');
const stageEl = document.getElementById('stageSel');
const spoilerEl = document.getElementById('spoilerBox');
const earnedEl = document.getElementById('earnedBox');
const emptyEl = document.getElementById('emptyNote');

let earned = readEarned();
const prefs = readPrefs();
spoilerEl.checked = prefs.spoilers;
earnedEl.checked = prefs.hideEarned;

const params = new URLSearchParams(location.search);
const demo = readDeepLink(params, prefs);
spoilerEl.checked = prefs.spoilers;
if (demo) {
  for (const trophy of trophies) {
    if (trophy.stage === 1 && trophy.kind === 'story') earned.add(trophy.name);
  }
}
// Deep-link scrolling for screenshots and shared links: ?scroll=<id>
// jumps to a section (e.g. list) after the first paint.
const scrollTo = params.get('scroll');

function repaint() {
  renderCards(trophies, prefs, earned, onCheck);
}

function onCheck(name, checked) {
  if (checked) earned.add(name);
  else earned.delete(name);
  if (!demo) writeEarned(earned);
  repaint();
}

function wireControls() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadEarned(data.game, earned);
  });

  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const known = new Set(trophies.map((t) => t.name));
      earned = new Set(parseEarnedFile(parsed).filter((name) => known.has(name)));
      writeEarned(earned);
      repaint();
    } catch {
      emptyEl.hidden = false;
      emptyEl.textContent = 'That file could not be imported as progress. Export from this page first, then import that file.';
    }
    event.target.value = '';
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    earned = new Set();
    writeEarned(earned);
    repaint();
  });

  for (const el of [qEl, kindEl, gradeEl, stageEl]) {
    el.addEventListener('input', repaint);
    el.addEventListener('change', repaint);
  }
  spoilerEl.addEventListener('change', () => {
    prefs.spoilers = spoilerEl.checked;
    writePrefs(prefs);
    repaint();
  });
  earnedEl.addEventListener('change', () => {
    prefs.hideEarned = earnedEl.checked;
    writePrefs(prefs);
    repaint();
  });
}

renderStageTotals(trophies);
wireControls();
repaint();
if (scrollTo) {
  const target = document.getElementById(scrollTo);
  if (target) target.scrollIntoView();
}
