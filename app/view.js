// Leonida Legend — rendering and filtering of the trophy checklist.
//
// One module owns the visible list: it decides which trophies match the
// toolbar, builds one card per trophy, and paints the progress bar and
// the per-stage counts on the roadmap. Spoiler mode masks the name and
// official description of story trophies the player has not earned yet.

const rowsEl = document.getElementById('rows');
const emptyEl = document.getElementById('empty');
const showingEl = document.getElementById('showing');
const progressEl = document.getElementById('progress');
const gradeLineEl = document.getElementById('progress-by-grade');
const fillEl = document.getElementById('progress-fill');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const stageEl = document.getElementById('stage');

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function applyUrlParams(params, settings) {
  const kind = params.get('kind');
  const grade = params.get('grade');
  const stage = params.get('stage');
  if (kind && [...kindEl.options].some((o) => o.value === kind)) kindEl.value = kind;
  if (grade && [...gradeEl.options].some((o) => o.value === grade)) gradeEl.value = grade;
  if (stage && [...stageEl.options].some((o) => o.value === stage)) stageEl.value = stage;
  if (params.get('q')) searchEl.value = params.get('q');
  if (params.get('spoilers') === '1') settings.spoilers = true;
  // Demo preview for screenshots: ?demo=1 ticks the stage-1 story
  // trophies in memory only, without writing localStorage.
  return params.get('demo') === '1';
}

function kindMatches(trophy) {
  const wanted = kindEl.value;
  if (wanted === 'all') return true;
  if (wanted === 'missable') return trophy.missable !== 'no';
  if (wanted === 'online') return trophy.tags.includes('online');
  return trophy.kind === wanted || trophy.tags.includes(wanted);
}

function textMatches(trophy) {
  const query = searchEl.value.trim().toLowerCase();
  if (!query) return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
  return haystack.includes(query);
}

export function matchingTrophies(trophies, settings, earned) {
  return trophies.filter((trophy) => {
    if (!kindMatches(trophy)) return false;
    if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
    if (stageEl.value !== 'all' && String(trophy.stage) !== stageEl.value) return false;
    if (settings.hideEarned && earned.has(trophy.name)) return false;
    return textMatches(trophy);
  });
}

function masked(trophy, settings, earned) {
  return settings.spoilers && trophy.kind === 'story' && !earned.has(trophy.name);
}

function pill(grade) {
  const span = document.createElement('span');
  span.className = `pill pill-${grade}`;
  span.textContent = grade;
  return span;
}

function chip(text, extraClass) {
  const span = document.createElement('span');
  span.className = `chip${extraClass ? ` ${extraClass}` : ''}`;
  span.textContent = text;
  return span;
}

function buildCard(trophy, settings, earned, onToggle) {
  const isEarned = earned.has(trophy.name);
  const isMasked = masked(trophy, settings, earned);
  const card = document.createElement('article');
  card.className = `trophy${isEarned ? ' earned' : ''}`;

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned;
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => onToggle(trophy.name, box.checked));
  const title = document.createElement('h3');
  title.textContent = isMasked ? 'Hidden story trophy' : trophy.name;
  head.append(box, title, pill(trophy.grade));

  const chips = document.createElement('div');
  chips.className = 'chips';
  if (trophy.hidden) chips.append(chip('hidden on PS', 'chip-hidden'));
  if (trophy.missable !== 'no') chips.append(chip('possibly missable', 'chip-missable'));
  chips.append(chip(trophy.kind));
  chips.append(chip(`stage ${trophy.stage}`));
  if (typeof trophy.target === 'number') chips.append(chip(`target: ${trophy.target.toLocaleString('en-US')}`));

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = isMasked
    ? 'Spoiler hidden — earn it, or turn off “Hide story spoilers”, to reveal it.'
    : `“${trophy.description}”`;

  const howto = document.createElement('p');
  howto.className = 'howto';
  const label = document.createElement('span');
  label.className = 'howto-label';
  label.textContent = 'How to earn it — ';
  howto.append(label, document.createTextNode(isMasked ? 'Guide hidden by the spoiler setting.' : trophy.guide));

  const cited = document.createElement('p');
  cited.className = 'cited';
  const citedLabel = document.createElement('strong');
  citedLabel.textContent = 'Sources: ';
  cited.append(citedLabel, document.createTextNode(trophy.sources.join(' · ')));

  card.append(head, chips, official, howto, cited);
  return card;
}

export function paintProgress(trophies, earned) {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  progressEl.textContent = `${done} of ${total} earned`;
  fillEl.style.width = `${total === 0 ? 0 : Math.round((done / total) * 100)}%`;
  gradeLineEl.textContent = GRADE_ORDER
    .map((grade) => {
      const ofGrade = trophies.filter((t) => t.grade === grade);
      const earnedOfGrade = ofGrade.filter((t) => earned.has(t.name)).length;
      return `${earnedOfGrade}/${ofGrade.length} ${grade}`;
    })
    .join(' · ');
}

export function paintStageCounts(trophies) {
  for (const stage of [1, 2, 3, 4]) {
    const el = document.querySelector(`[data-stage-count="${stage}"]`);
    if (el) el.textContent = `${trophies.filter((t) => t.stage === stage).length} trophies in this stage`;
  }
}

export function paintList(trophies, settings, earned, onToggle) {
  const visible = matchingTrophies(trophies, settings, earned);
  rowsEl.replaceChildren(...visible.map((t) => buildCard(t, settings, earned, onToggle)));
  emptyEl.hidden = visible.length !== 0;
  if (visible.length === 0) {
    emptyEl.textContent = kindEl.value === 'online'
      ? 'No online trophies: all 55 trophies in this list are single-player (GTABase and KeenGamer launch-day guides agree). Nothing to track here — and no boosting partner required.'
      : 'No trophies match these filters. Loosen the search or pick another kind, grade or stage.';
  }
  showingEl.textContent = `Showing ${visible.length} of ${trophies.length} trophies`;
  paintProgress(trophies, earned);
}
