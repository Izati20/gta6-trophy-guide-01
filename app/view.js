// Leonida Legend — rendering and filtering of the trophy checklist.
//
// This module owns what the player sees: which trophies match the
// filter bar, one card per trophy, the progress meter and the per-stage
// totals on the roadmap. Spoiler mode masks the name and official
// description of story trophies the player has not earned yet.

const cardsEl = document.getElementById('cards');
const emptyEl = document.getElementById('emptyNote');
const countEl = document.getElementById('countLine');
const meterTextEl = document.getElementById('meterText');
const meterGradesEl = document.getElementById('meterGrades');
const meterFillEl = document.getElementById('meterFill');
const qEl = document.getElementById('q');
const kindEl = document.getElementById('kindSel');
const gradeEl = document.getElementById('gradeSel');
const stageEl = document.getElementById('stageSel');

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export function readDeepLink(params, prefs) {
  const kind = params.get('kind');
  const grade = params.get('grade');
  const stage = params.get('stage');
  if (kind && [...kindEl.options].some((o) => o.value === kind)) kindEl.value = kind;
  if (grade && [...gradeEl.options].some((o) => o.value === grade)) gradeEl.value = grade;
  if (stage && [...stageEl.options].some((o) => o.value === stage)) stageEl.value = stage;
  if (params.get('q')) qEl.value = params.get('q');
  if (params.get('spoilers') === '1') prefs.spoilers = true;
  // Preview for screenshots: ?demo=1 ticks the stage-1 story trophies
  // in memory only, without writing localStorage.
  return params.get('demo') === '1';
}

function kindOk(trophy) {
  const wanted = kindEl.value;
  if (wanted === 'all') return true;
  if (wanted === 'missable') return trophy.missable !== 'no';
  if (wanted === 'online') return trophy.tags.includes('online');
  return trophy.kind === wanted || trophy.tags.includes(wanted);
}

function queryOk(trophy) {
  const query = qEl.value.trim().toLowerCase();
  if (!query) return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
  return haystack.includes(query);
}

export function visibleTrophies(trophies, prefs, earned) {
  return trophies.filter((trophy) => {
    if (!kindOk(trophy)) return false;
    if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
    if (stageEl.value !== 'all' && String(trophy.stage) !== stageEl.value) return false;
    if (prefs.hideEarned && earned.has(trophy.name)) return false;
    return queryOk(trophy);
  });
}

function concealed(trophy, prefs, earned) {
  return prefs.spoilers && trophy.kind === 'story' && !earned.has(trophy.name);
}

function makeBadge(grade) {
  const span = document.createElement('span');
  span.className = `badge badge--${grade}`;
  span.textContent = grade;
  return span;
}

function makeTag(text, extraClass) {
  const span = document.createElement('span');
  span.className = `tag${extraClass ? ` ${extraClass}` : ''}`;
  span.textContent = text;
  return span;
}

function buildCard(trophy, prefs, earned, onCheck) {
  const done = earned.has(trophy.name);
  const hiddenName = concealed(trophy, prefs, earned);
  const card = document.createElement('article');
  card.className = `card card--${trophy.grade}${done ? ' card--done' : ''}`;

  const top = document.createElement('div');
  top.className = 'card-top';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = done;
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => onCheck(trophy.name, box.checked));
  const title = document.createElement('h3');
  title.textContent = hiddenName ? 'Hidden story trophy' : trophy.name;
  top.append(box, title, makeBadge(trophy.grade));

  const tags = document.createElement('div');
  tags.className = 'tags';
  if (trophy.hidden) tags.append(makeTag('hidden on PS', 'tag--secret'));
  if (trophy.missable !== 'no') tags.append(makeTag('possibly missable', 'tag--warn'));
  tags.append(makeTag(trophy.kind));
  tags.append(makeTag(`stage ${trophy.stage}`));
  if (typeof trophy.target === 'number') tags.append(makeTag(`target: ${trophy.target.toLocaleString('en-US')}`));

  const quote = document.createElement('p');
  quote.className = 'quote';
  quote.textContent = hiddenName
    ? 'Spoiler hidden — earn it, or turn off “Hide story spoilers”, to reveal it.'
    : `“${trophy.description}”`;

  const method = document.createElement('p');
  method.className = 'method';
  const methodLabel = document.createElement('span');
  methodLabel.className = 'method-label';
  methodLabel.textContent = 'How to earn it — ';
  method.append(methodLabel, document.createTextNode(hiddenName ? 'Method hidden by the spoiler setting.' : trophy.guide));

  const cite = document.createElement('p');
  cite.className = 'cite';
  const citeLabel = document.createElement('strong');
  citeLabel.textContent = 'Sources: ';
  cite.append(citeLabel, document.createTextNode(trophy.sources.join(' · ')));

  card.append(top, tags, quote, method, cite);
  return card;
}

export function renderMeter(trophies, earned) {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  meterTextEl.textContent = `${done} of ${total} earned`;
  meterFillEl.style.width = `${total === 0 ? 0 : Math.round((done / total) * 100)}%`;
  meterGradesEl.textContent = GRADES
    .map((grade) => {
      const ofGrade = trophies.filter((t) => t.grade === grade);
      const doneOfGrade = ofGrade.filter((t) => earned.has(t.name)).length;
      return `${doneOfGrade}/${ofGrade.length} ${grade}`;
    })
    .join(' · ');
}

export function renderStageTotals(trophies) {
  for (const stage of [1, 2, 3, 4]) {
    const el = document.querySelector(`[data-stage-total="${stage}"]`);
    if (el) el.textContent = `${trophies.filter((t) => t.stage === stage).length} trophies in this stage`;
  }
}

export function renderCards(trophies, prefs, earned, onCheck) {
  const shown = visibleTrophies(trophies, prefs, earned);
  cardsEl.replaceChildren(...shown.map((t) => buildCard(t, prefs, earned, onCheck)));
  emptyEl.hidden = shown.length !== 0;
  if (shown.length === 0) {
    emptyEl.textContent = kindEl.value === 'online'
      ? 'No online trophies: all 55 trophies in this list are single-player (GTABase and KeenGamer launch-day guides agree). Nothing to track here — and no boosting partner required.'
      : 'No trophies match these filters. Loosen the search or pick another kind, grade or stage.';
  }
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  renderMeter(trophies, earned);
}
