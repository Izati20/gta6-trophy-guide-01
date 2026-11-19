// Leonida Legend — a GTA VI trophy guide and tracker. Loads the guide's own data files (the official
// trophy list with our guides, and the roadmap), renders the roadmap, the missable warnings and the
// checklist, and wires the tracker: earned ticks, kind / grade / search filters, the spoiler setting,
// and export / import of progress. Everything runs from this folder; nothing is fetched off-device.

import { loadEarned, saveEarned, exportEarned, importEarned } from './tracker.js';

const KIND_LABELS = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', misc: 'Misc & feats' };

const elements = {
  progress: document.getElementById('progress'),
  progressBar: document.getElementById('progress-bar'),
  progressGrades: document.getElementById('progress-grades'),
  roadmapTitle: document.getElementById('roadmap-title'),
  roadmapSummary: document.getElementById('roadmap-summary'),
  roadmapSteps: document.getElementById('roadmap-steps'),
  roadmapSources: document.getElementById('roadmap-sources'),
  missableList: document.getElementById('missable-list'),
  search: document.getElementById('search'),
  grade: document.getElementById('grade'),
  spoilers: document.getElementById('spoilers'),
  hideEarned: document.getElementById('hide-earned'),
  kindRow: document.getElementById('kind-row'),
  onlineNote: document.getElementById('online-note'),
  listStatus: document.getElementById('list-status'),
  rows: document.getElementById('rows'),
  detail: document.getElementById('detail'),
  detailGrade: document.getElementById('detail-grade'),
  detailName: document.getElementById('detail-name'),
  detailDescription: document.getElementById('detail-description'),
  detailFlags: document.getElementById('detail-flags'),
  detailGuide: document.getElementById('detail-guide'),
  detailSources: document.getElementById('detail-sources'),
  detailEarned: document.getElementById('detail-earned'),
  detailClose: document.getElementById('detail-close'),
  exportButton: document.getElementById('export'),
  importInput: document.getElementById('import'),
};

const guideData = await (await fetch('data/trophies.json')).json();
const roadmapData = await (await fetch('data/roadmap.json')).json();
const trophies = guideData.trophies;
const trophiesByName = new Map(trophies.map((t) => [t.name, t]));

let earned = loadEarned();
let activeKind = 'all';
let selectedId = null;

/** Whether the spoiler setting currently hides this trophy's identity (a story trophy not yet earned). */
function isSpoilerHidden(trophy) {
  return elements.spoilers.checked && trophy.kind === 'story' && !earned.has(trophy.id);
}

/** The header progress line: totals, a bar, and the per-grade earned counts. */
function renderProgress() {
  elements.progress.textContent = `${earned.size} of ${trophies.length} earned`;
  elements.progressBar.style.width = `${(earned.size / trophies.length) * 100}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    return `${grade} ${got}/${total}`;
  });
  elements.progressGrades.textContent = parts.join(' · ');
}

/** The missable panel: one warning card per trophy flagged missable in the data. */
function renderMissables() {
  elements.missableList.replaceChildren();
  for (const trophy of trophies.filter((t) => t.missable)) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'missable-name';
    button.textContent = trophy.name;
    button.addEventListener('click', () => openGuide(trophy.id));
    const p = document.createElement('p');
    p.textContent = trophy.guide.split('. ')[0] + '.';
    li.append(button, p);
    elements.missableList.append(li);
  }
}

/** Whether a trophy passes the current kind, grade, search and hide-earned filters. */
function trophyMatchesFilters(trophy) {
  if (activeKind === 'missable' && !trophy.missable) return false;
  if (activeKind === 'online') return false; // the official list holds no online trophies
  if (activeKind !== 'all' && activeKind !== 'missable' && trophy.kind !== activeKind) return false;
  if (elements.grade.value !== 'all' && trophy.grade !== elements.grade.value) return false;
  if (elements.hideEarned.checked && earned.has(trophy.id)) return false;
  const query = elements.search.value.trim().toLowerCase();
  if (query !== '') {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

/** One checklist card: tick box, grade, name, official description, flags, and the start of the guide. */
function buildCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(trophy.id) ? ' card-earned' : '');
  const hidden = isSpoilerHidden(trophy);

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => toggleEarned(trophy.id, box.checked));
  const grade = document.createElement('span');
  grade.className = `badge grade-${trophy.grade}`;
  grade.textContent = trophy.grade;
  const kind = document.createElement('span');
  kind.className = 'badge kind-badge';
  kind.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  head.append(box, grade, kind);
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'badge missable-badge';
    flag.textContent = 'MISSABLE';
    head.append(flag);
  }
  if (trophy.hidden) {
    const flag = document.createElement('span');
    flag.className = 'badge hidden-badge';
    flag.textContent = 'Hidden on PSN';
    head.append(flag);
  }

  const name = document.createElement('h3');
  name.textContent = hidden ? 'Hidden trophy' : trophy.name;
  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = hidden ? 'A story trophy. Its name and description stay hidden until you earn it — the spoiler setting is on.' : trophy.description;
  const guide = document.createElement('p');
  guide.className = 'card-guide';
  guide.textContent = hidden ? 'Earn it in the story to reveal its guide here, or turn the spoiler setting off.' : trophy.guide;
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'open-guide';
  open.textContent = 'Read the full guide';
  open.addEventListener('click', () => openGuide(trophy.id));

  card.append(head, name, description, guide, open);
  return card;
}

/** Re-render the checklist under the current filters, and the status line above it. */
function renderCards() {
  const shown = trophies.filter(trophyMatchesFilters);
  elements.rows.replaceChildren(...shown.map(buildCard));
  elements.onlineNote.hidden = activeKind !== 'online';
  elements.listStatus.textContent = activeKind === 'online'
    ? 'Showing 0 trophies: the official PlayStation 5 list contains no online trophies.'
    : `Showing ${shown.length} of ${trophies.length} trophies`;
  renderProgress();
}

/** Tick or untick a trophy, persist, and refresh everything that shows its state. */
function toggleEarned(id, isEarned) {
  if (isEarned) earned.add(id);
  else earned.delete(id);
  saveEarned(earned);
  renderCards();
  renderRoadmapState();
  if (selectedId === id) openGuide(id);
}

/** Re-render the roadmap steps after a tick, so their chips show the new earned state. */
function renderRoadmapState() {
  elements.roadmapSteps.replaceChildren();
  renderRoadmapStepsOnly(roadmapData.steps);
}

/** Render just the roadmap step list (used on first load and after ticks). */
function renderRoadmapStepsOnly(steps) {
  for (const step of steps) {
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    h3.textContent = `Step ${step.n} — ${step.title} `;
    const hours = document.createElement('span');
    hours.className = 'step-hours';
    hours.textContent = step.hours;
    h3.append(hours);
    const p = document.createElement('p');
    p.textContent = step.text;
    const chips = document.createElement('p');
    chips.className = 'step-trophies';
    for (const name of step.trophies) {
      const trophy = trophiesByName.get(name);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (trophy && earned.has(trophy.id) ? ' chip-earned' : '');
      chip.textContent = name;
      if (trophy) chip.addEventListener('click', () => openGuide(trophy.id));
      chips.append(chip);
    }
    li.append(h3, p, chips);
    elements.roadmapSteps.append(li);
  }
}

/** Open the detail panel on one trophy: its official facts, flags, full guide and sources. */
function openGuide(id) {
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy) return;
  selectedId = id;
  const hidden = isSpoilerHidden(trophy);
  elements.detailGrade.textContent = `${trophy.grade} · ${KIND_LABELS[trophy.kind] ?? trophy.kind}`;
  elements.detailName.textContent = hidden ? 'Hidden trophy' : trophy.name;
  elements.detailDescription.textContent = hidden ? 'Hidden until earned (spoiler setting is on).' : trophy.description;
  const flags = [];
  if (trophy.missable) flags.push('MISSABLE — see the warning in the guide');
  if (trophy.hidden) flags.push('Hidden trophy on PlayStation');
  if (trophy.kind === 'story') flags.push('Story trophy');
  elements.detailFlags.textContent = flags.join(' · ');
  elements.detailGuide.textContent = hidden ? 'This guide is hidden until the trophy is earned, so the story stays unspoiled. Turn the spoiler setting off to read it now.' : trophy.guide;
  elements.detailSources.textContent = hidden ? '' : `Sources: ${trophy.sources}`;
  elements.detailEarned.checked = earned.has(id);
  elements.detail.hidden = false;
  elements.detail.scrollIntoView({ block: 'nearest' });
}

/** Close the detail panel. */
function closeGuide() {
  selectedId = null;
  elements.detail.hidden = true;
}

/** Deep links for screenshots and sharing: ?open=<id>&filter=<kind>&grade=<grade>&spoilers=1&q=<text>. */
function applyUrlState() {
  const params = new URLSearchParams(location.search);
  const filter = params.get('filter');
  if (filter) setActiveKind(filter);
  const grade = params.get('grade');
  if (grade) elements.grade.value = grade;
  if (params.get('spoilers') === '1') elements.spoilers.checked = true;
  const query = params.get('q');
  if (query) elements.search.value = query;
  const open = Number(params.get('open'));
  if (Number.isInteger(open) && open > 0) openGuide(open);
}

/** Switch the kind filter and its button states. */
function setActiveKind(kind) {
  activeKind = kind;
  for (const button of elements.kindRow.querySelectorAll('.kind-btn')) {
    button.classList.toggle('active', button.dataset.kind === kind);
  }
  renderCards();
}

elements.kindRow.addEventListener('click', (event) => {
  const button = event.target.closest('.kind-btn');
  if (button) setActiveKind(button.dataset.kind);
});
elements.grade.addEventListener('change', renderCards);
elements.search.addEventListener('input', renderCards);
elements.spoilers.addEventListener('change', () => { renderCards(); if (selectedId !== null) openGuide(selectedId); });
elements.hideEarned.addEventListener('change', renderCards);
elements.exportButton.addEventListener('click', () => exportEarned(earned));
elements.importInput.addEventListener('change', async () => {
  const file = elements.importInput.files[0];
  if (!file) return;
  try {
    earned = await importEarned(file);
    saveEarned(earned);
    renderCards();
    renderRoadmapState();
  } catch {
    elements.listStatus.textContent = 'That file could not be read as Leonida Legend progress.';
  }
});
elements.detailEarned.addEventListener('change', () => { if (selectedId !== null) toggleEarned(selectedId, elements.detailEarned.checked); });
elements.detailClose.addEventListener('click', closeGuide);

// First render: roadmap summary and missables once, steps and cards under the URL's state.
(function firstRender() {
  elements.roadmapTitle.textContent = roadmapData.title;
  const labels = { difficulty: 'Platinum difficulty', hours: 'Estimated time', playthroughs: 'Playthroughs', missables: 'Missables', online: 'Online trophies' };
  for (const [key, label] of Object.entries(labels)) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = roadmapData.summary[key];
    elements.roadmapSummary.append(dt, dd);
  }
  elements.roadmapSources.textContent = `Sources: ${roadmapData.sources}`;
  renderRoadmapStepsOnly(roadmapData.steps);
  renderMissables();
  applyUrlState();
  renderCards();
  // A #fragment deep link (for example #rows or #detail) lands on its section once the content exists.
  const anchor = location.hash.slice(1);
  if (anchor) document.getElementById(anchor)?.scrollIntoView();
})();
