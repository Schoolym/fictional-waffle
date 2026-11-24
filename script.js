const CARDS = [];
(function parse(){
  let L = 0, cat = '', catBg = '';
  RAW.split('\n').forEach(line => {
    line = line.trim(); if (!line) return;
    if (line[0] === '#') { L = +line.slice(1); return; }
    if (line[0] === '@') { [cat, catBg] = line.slice(1).split('|'); return; }
    const [de, bg, pl = '', note = ''] = line.split('|');
    let type = 'word', art = null, stem = de;
    if (pl) {
      type = 'noun';
      const m = de.match(/^(der|die|das) (.+)$/);
      if (m) { art = pl === 'nur Pl.' ? 'pl' : m[1]; stem = m[2]; }
    } else if (/[!?.…]$/.test(de) || de.includes(' ')) type = 'phrase';
    CARDS.push({ id: 'L' + L + ':' + de, l: L, cat, catBg, de, bg, pl, note, type, art, stem });
  });
})();
const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
const LESSONS = [1, 2, 3, 4];

const LS = 'wortschatz-progress-v1', LSF = 'wortschatz-ui-v1';
let prog = {};
try { prog = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { prog = {}; }
const save = () => { try { localStorage.setItem(LS, JSON.stringify(prog)); } catch (e) {} };
let ui = { mode: 'cards', lessons: [...LESSONS], cat: 'all', dir: 'de', hideKnown: false, size: '20', sound: false };
try { Object.assign(ui, JSON.parse(localStorage.getItem(LSF)) || {}); } catch (e) {}
const saveUi = () => { try { localStorage.setItem(LSF, JSON.stringify(ui)); } catch (e) {} };
const box = c => (prog[c.id] ? prog[c.id].b : 0);
const rec = c => prog[c.id] || (prog[c.id] = { b: 0, s: 0, w: 0 });
function touch(c) { rec(c).s++; save(); updateStats(); }
function mark(c, ok) {
  const p = rec(c);
  if (ok) p.b = Math.min(5, p.b + 1); else { p.b = 0; p.w++; }
  touch(c);
}

const $ = s => document.querySelector(s);
const view = $('#view');
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad = n => String(n).padStart(2, '0');
const TYPE = { noun: 'Съществително', phrase: 'Израз', word: 'Дума' };
const GENDER = { der: 'der · мъжки род', die: 'die · женски род', das: 'das · среден род', pl: 'die · само множествено число' };
const MODE_NAME = { cards: 'Флашкарти', quiz: 'Тест', type: 'Напиши', articles: 'der · die · das', list: 'Речник' };
function plural(c) {
  if (c.pl === '–') return 'без мн. ч.';
  if (c.pl === 'nur Pl.') return 'само мн. ч.';
  if (c.pl === 'nur Sg.') return 'само ед. ч.';
  return esc(c.pl);
}
function wordHTML(c) {
  if (c.art) return `<span class="art a-${c.art}">${c.art === 'pl' ? 'die' : c.art}</span> ${esc(c.stem)}`;
  return esc(c.de);
}
function status(c) {
  const p = prog[c.id];
  if (!p) return ['new', 'Нова'];
  if (p.b === 0) return ['rep', 'За повторение'];
  if (p.b < 3) return ['lrn', 'Учи се · ' + p.b + '/3'];
  return ['ok', 'Научена'];
}
const ICON = {
  info: '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="gi" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9CC7FF"/><stop offset="1" stop-color="#1D5FD0"/></radialGradient></defs><circle cx="16" cy="16" r="14" fill="url(#gi)" stroke="#0E3E9A"/><circle cx="16" cy="9.5" r="2.2" fill="#fff"/><path d="M13.5 13.5h3.8v9.5h2v2h-7v-2h2v-7.5h-.8z" fill="#fff"/></svg>',
  error: '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="ge" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF9C8A"/><stop offset="1" stop-color="#C3261D"/></radialGradient></defs><circle cx="16" cy="16" r="14" fill="url(#ge)" stroke="#7E120B"/><path d="M10.5 10.5l11 11M21.5 10.5l-11 11" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3L30 28H2z" fill="#F7D33C" stroke="#8A6A00" stroke-linejoin="round"/><path d="M16 11v8" stroke="#1C1C1C" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="23.5" r="1.8" fill="#1C1C1C"/></svg>',
  ok: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#3FA52A" stroke="#1E6012"/><path d="M9.5 16.5l4.5 4.5 8.5-9" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9z" fill="#4A6EB5"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke="#4A6EB5" stroke-width="1.8" fill="none"/></svg>'
};
const X_ICON = '<svg viewBox="0 0 11 11" aria-hidden="true"><path d="M2 2l7 7M9 2l-7 7"/></svg>';
const dlgHTML = (title, close, icon, msg, btns) => `<div class="titlebar"><h2${close ? ' id="mdT"' : ''}>${esc(title)}</h2><button class="tbtn close" ${close || 'tabindex="-1"'} aria-label="Затвори">${X_ICON}</button></div>
    <div class="body"><div class="msg">${ICON[icon]}<div>${msg}</div></div><div class="btns">${btns}</div></div>`;
const fbHTML = (k, title, detail) => `<div class="fb ${k}">${ICON[k === 'ok' ? 'ok' : k === 'no' ? 'error' : 'warn']}<div>${title}<span class="detail">${detail}</span></div></div>`;
const scoreHTML = (right, total, extra) => `<div class="score"><span>Точни: <b>${right}</b> от ${total}</span><span>${extra}</span></div>`;
const ghHTML = (c, extra = '') => `<div class="gh">Л${c.l} · ${esc(c.catBg)}${extra}</div>`;
const nextHTML = act => `<div class="row"><button class="xbtn def big" data-act="${act}" data-focus>${act === 'nextQ' ? 'Следващ' : 'Следваща'} <kbd>Enter</kbd></button></div>`;
const randDir = () => ui.dir === 'mix' ? (Math.random() < .5 ? 'de' : 'bg') : ui.dir;
const sayBtn = (c, sm) => `<button class="xbtn say${sm ? ' sm' : ''}" data-say="${esc(c.id)}" aria-label="Чуй произношението" title="Чуй (S)">${ICON.speaker}</button>`;
const W = [10, 6, 4, 2, 1, .5];
function pickWeighted(arr, avoid) {
  if (!arr.length) return null;
  const list = arr.length > 1 ? arr.filter(c => c.id !== avoid) : arr;
  let tot = 0; const ws = list.map(c => { const p = prog[c.id]; const w = p ? W[p.b] : 7; tot += w; return w; });
  let r = Math.random() * tot;
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let deVoice = null; const canSpeak = 'speechSynthesis' in window;
if (!canSpeak) document.documentElement.classList.add('nospeech');
function loadVoices() { try { const vs = speechSynthesis.getVoices(); deVoice = vs.find(v => /^de[-_]DE/i.test(v.lang)) || vs.find(v => /^de/i.test(v.lang)) || null; } catch (e) {} }
if (canSpeak) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
function speak(text) {
  if (!canSpeak) return;
  try {
    const t = text.replace(/\((.*?)\)/g, '$1').replace(/…/g, ' ').replace(/ \/ /g, ', ');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t); u.lang = 'de-DE'; if (deVoice) u.voice = deVoice; u.rate = .88;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let lastAuto = '';
function autoSay(key, text) { if (ui.sound && key !== lastAuto) { lastAuto = key; speak(text); } }
function renderSound() {
  const b = $('#soundBtn'), t = 'Звук: ' + (ui.sound ? 'вкл' : 'изкл');
  b.setAttribute('aria-pressed', ui.sound); b.setAttribute('aria-label', t); $('#smSound').textContent = t;
}
function toggleSound() { ui.sound = !ui.sound; saveUi(); renderSound(); balloon('Звук', ui.sound ? 'Немските думи ще се произнасят сами.' : 'Автоматичното произношение е изключено.'); if (ui.sound) speak('Hallo!'); }
$('#soundBtn').addEventListener('click', toggleSound);

let balloonTimer = null;
function balloon(title, text, icon = 'info') {
  const b = $('#balloon');
  b.innerHTML = `<b>${ICON[icon]}${esc(title)}</b>${esc(text)}`;
  b.hidden = false; clearTimeout(balloonTimer);
  balloonTimer = setTimeout(() => { b.hidden = true; }, 2600);
}
$('#balloon').addEventListener('click', () => { $('#balloon').hidden = true; });
const toasts = $('#toasts');
function errorBox(title, line1, line2) {
  const open = toasts.querySelectorAll('.dlg');
  if (open.length >= 6) open[0].remove();
  const n = toasts.querySelectorAll('.dlg').length;
  const d = document.createElement('div');
  d.className = 'dlg';
  const narrow = innerWidth < 640;
  d.style.right = `calc(${12 + n * 22}px + env(safe-area-inset-right,0px))`;
  d.style.bottom = `calc(var(--tb) + env(safe-area-inset-bottom,0px) + ${(narrow ? 70 : 16) + n * 22}px)`;
  if (narrow) d.style.right = `${8 + n * 10}px`;
  d.innerHTML = dlgHTML(title, '', 'error', `<b>${esc(line1)}</b>${line2 ? esc(line2) : ''}`, '<button class="xbtn def" tabindex="-1">OK</button>');
  d.addEventListener('click', e => { if (e.target.closest('button')) d.remove(); });
  toasts.appendChild(d);
  setTimeout(() => d.remove(), 5000);
}
function clearErrors() { toasts.innerHTML = ''; }
let modalOpen = null;
function modal({ title, icon = 'info', html, buttons }) {
  closeModal();
  const back = document.createElement('div'); back.className = 'scrim';
  const d = document.createElement('div'); d.className = 'dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'mdT');
  d.style.left = '50%'; d.style.top = '42%'; d.style.transform = 'translate(-50%,-50%)';
  d.innerHTML = dlgHTML(title, 'data-mb="cancel"', icon, html, buttons.map((b, i) => `<button class="xbtn${i === 0 ? ' def' : ''}" data-mb="${i}">${esc(b.label)}</button>`).join(''));
  const prevFocus = document.activeElement;
  const close = () => { back.remove(); d.remove(); modalOpen = null; if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true }); };
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-mb]'); if (!b) return;
    const i = b.dataset.mb; close(); if (i !== 'cancel' && buttons[+i].run) buttons[+i].run();
  });
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = [...d.querySelectorAll('button')]; const i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  back.addEventListener('click', close);
  $('#modalRoot').append(back, d);
  modalOpen = { close };
  d.querySelector('.xbtn.def').focus();
}
function closeModal() { if (modalOpen) modalOpen.close(); }
function confirmReset() {
  modal({ title: 'Потвърждение за изтриване', icon: 'warn',
    html: `<b>Наистина ли искате да изпразните кошчето?</b>Целият ви напредък (научени и започнати думи) ще бъде изтрит завинаги.`,
    buttons: [{ label: 'Не' }, { label: 'Да', run: () => { prog = {}; save(); updateStats(); resetModes(); renderFilters(); render(); balloon('Кошчето е празно', 'Напредъкът е изчистен. Започвате отначало.'); } }] });
}
function showHelp() {
  modal({ title: 'Помощ – клавишни комбинации', icon: 'info',
    html: `<b>Флашкарти</b>Space – обръщане · ← не знам · → знам · S – произношение<br><b style="margin-top:6px">Тест</b>1–4 – отговор · Enter – следващ въпрос<br><b style="margin-top:6px">der · die · das</b>1, 2, 3 – член · Enter – следваща дума<br><b style="margin-top:6px">Табове</b>← → , Home, End`,
    buttons: [{ label: 'OK' }] });
}

function pool() {
  return CARDS.filter(c => ui.lessons.includes(c.l) && (ui.cat === 'all' || ui.cat === c.l + '|' + c.cat) && !(ui.hideKnown && box(c) >= 3));
}
function renderFilters() {
  $('#lessonChecks').innerHTML = LESSONS.map(l => {
    const all = CARDS.filter(c => c.l === l), done = all.filter(c => box(c) >= 3).length;
    return `<label class="xcheck"><input type="checkbox" data-lesson="${l}"${ui.lessons.includes(l) ? ' checked' : ''}> Лекция ${l} <small>${done}/${all.length}</small></label>`;
  }).join('');
  const cats = []; const seen = new Set();
  CARDS.forEach(c => { const k = c.l + '|' + c.cat; if (ui.lessons.includes(c.l) && !seen.has(k)) { seen.add(k); cats.push([k, c.l, c.catBg, c.cat]); } });
  if (ui.cat !== 'all' && !seen.has(ui.cat)) ui.cat = 'all';
  $('#cat').innerHTML = `<option value="all">Всички теми</option>` + cats.map(([k, l, bg, de]) => `<option value="${esc(k)}"${k === ui.cat ? ' selected' : ''}>Л${l} · ${esc(bg)} (${esc(de)})</option>`).join('');
  document.querySelectorAll('#dir input').forEach(r => { r.checked = r.value === ui.dir; });
  $('#dir').hidden = !(ui.mode === 'cards' || ui.mode === 'quiz');
  $('#hideKnown').checked = ui.hideKnown;
  $('#hideWrap').hidden = ui.mode === 'list';
}
$('#lessonChecks').addEventListener('change', e => {
  const cb = e.target.closest('[data-lesson]'); if (!cb) return;
  const l = +cb.dataset.lesson;
  if (cb.checked) ui.lessons = [...new Set([...ui.lessons, l])].sort();
  else if (ui.lessons.length > 1) ui.lessons = ui.lessons.filter(x => x !== l);
  else { cb.checked = true; balloon('Лекции', 'Поне една лекция трябва да остане избрана.', 'warn'); return; }
  filtersChanged();
});
$('#cat').addEventListener('change', e => { ui.cat = e.target.value; filtersChanged(); });
$('#dir').addEventListener('change', e => { if (e.target.name === 'dir') { ui.dir = e.target.value; filtersChanged(); } });
$('#hideKnown').addEventListener('change', e => { ui.hideKnown = e.target.checked; filtersChanged(); });
function filtersChanged() { saveUi(); renderFilters(); resetModes(); render(); }

function updateStats() {
  const tot = CARDS.length; let m = 0, s = 0;
  CARDS.forEach(c => { const p = prog[c.id]; if (!p) return; if (p.b >= 3) m++; else s++; });
  const pct = Math.round(m / tot * 100);
  $('#stBar').style.width = (m / tot * 100) + '%';
  $('#stPct').textContent = pct + '% научени';
  $('#stLegend').textContent = `Научени ${m} · Започнати ${s} · Нови ${tot - m - s}`;
}

const win = $('#win');
function setTitle() {
  const t = 'Wortschatz – ' + MODE_NAME[ui.mode];
  $('#winTitle').textContent = t; $('#taskLabel').textContent = t;
  document.querySelectorAll('.dicon').forEach(d => d.setAttribute('aria-current', d.dataset.open === ui.mode && !win.hidden));
}
function openWindow(mode) {
  if (mode === 'trash') { confirmReset(); return; }
  const wasHidden = win.hidden;
  win.hidden = false; $('#taskBtn').parentElement.hidden = false; $('#taskBtn').setAttribute('aria-pressed', 'true');
  if (wasHidden && !reduceMotion) { win.classList.remove('opening'); void win.offsetWidth; win.classList.add('opening'); }
  if (mode && mode !== ui.mode) { ui.mode = mode; saveUi(); renderFilters(); }
  render();
}
$('#titlebar').addEventListener('click', e => {
  const b = e.target.closest('[data-win]'); if (!b) return;
  const a = b.dataset.win;
  if (a === 'min') { win.hidden = true; $('#taskBtn').setAttribute('aria-pressed', 'false'); $('#taskBtn').focus(); }
  else if (a === 'max') { win.classList.toggle('max'); b.setAttribute('aria-label', win.classList.contains('max') ? 'Възстанови' : 'Увеличи'); }
  else if (a === 'close') { win.hidden = true; $('#taskBtn').parentElement.hidden = true; clearErrors(); balloon('Прозорецът е затворен', 'Отвори го отново от иконите на работния плот или от менюто „старт“.'); }
  setTitle();
});
$('#titlebar').addEventListener('dblclick', e => { if (!e.target.closest('button') && innerWidth > 640) win.classList.toggle('max'); });
$('#taskBtn').addEventListener('click', () => {
  if (win.hidden) openWindow(); else { win.hidden = true; $('#taskBtn').setAttribute('aria-pressed', 'false'); setTitle(); }
});
$('#icons').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openWindow(b.dataset.open); });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; ui.mode = b.dataset.mode; saveUi(); renderFilters(); render(); });
$('#tabs').addEventListener('keydown', e => {
  const tabs = [...document.querySelectorAll('#tabs button')], i = tabs.indexOf(document.activeElement); if (i < 0) return;
  let j = null;
  if (e.key === 'ArrowRight') j = (i + 1) % tabs.length; else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1;
  if (j === null) return;
  e.preventDefault(); e.stopPropagation(); tabs[j].click(); tabs[j].focus();
});

const smenu = $('#smenu'), startBtn = $('#startBtn');
function setMenu(open) {
  smenu.hidden = !open; startBtn.setAttribute('aria-expanded', open);
  if (open) smenu.querySelector('[role="menuitem"]').focus();
}
startBtn.addEventListener('click', () => setMenu(smenu.hidden));
smenu.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  setMenu(false);
  if (b.dataset.open) openWindow(b.dataset.open);
  else if (b.dataset.menu === 'sound') toggleSound();
  else if (b.dataset.menu === 'help') showHelp();
  else if (b.dataset.menu === 'close') $('#titlebar [data-win="close"]').click();
});
smenu.addEventListener('keydown', e => {
  const items = [...smenu.querySelectorAll('button')], i = items.indexOf(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); setMenu(false); startBtn.focus(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  e.stopPropagation();
});
document.addEventListener('pointerdown', e => { if (!smenu.hidden && !smenu.contains(e.target) && !startBtn.contains(e.target)) setMenu(false); });

function tick() { const d = new Date(); $('#clock').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()); }
tick(); setInterval(tick, 15000);

const announce = t => { const l = $('#live'); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = t; }, 40); };
let timer = null;
function render() {
  clearTimeout(timer);
  const fa = document.activeElement, hadFocus = view.contains(fa), prevAct = hadFocus && fa.dataset ? fa.dataset.act : null;
  document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.mode === ui.mode; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; b.setAttribute('aria-controls', 'view'); });
  setTitle();
  ({ cards: renderCards, quiz: renderQuiz, type: renderType, articles: renderArticles, list: renderList })[ui.mode]();
  if (hadFocus && !view.contains(document.activeElement)) {
    const t = view.querySelector('[data-focus]') || (prevAct && view.querySelector(`[data-act="${prevAct}"]:not(:disabled)`)) || view.querySelector('.opts .opt:not(:disabled), .genders .gbtn:not(:disabled), .actions .xbtn');
    if (t) t.focus({ preventScroll: true });
  }
}
function resetModes() { cs.queue = []; qs.c = null; ts.c = null; as.c = null; }
const NO_WORDS = 'Няма думи за тези филтри.';
const emptyMsg = t => `<div class="msgbox">${ICON.info.replace('<svg', '<svg class="big"')}<div><h2>Няма какво да се покаже</h2><p>${t}</p></div></div>`;
function setStatus(t) { $('#stText').textContent = t; }

const cs = { queue: [], i: 0, flipped: false, dirNow: 'de', firstTry: 0, missed: new Set(), requeue: {} };
function rank(c) { const p = prog[c.id]; if (!p) return 1; if (p.b === 0) return 0; return 1 + p.b; }
function newRound(cards) {
  let deck;
  if (cards) deck = shuffle(cards.slice());
  else {
    const sorted = shuffle(pool().slice()).sort((a, b) => rank(a) - rank(b));
    const n = ui.size === 'all' ? sorted.length : Math.min(+ui.size, sorted.length);
    deck = shuffle(sorted.slice(0, n));
  }
  Object.assign(cs, { queue: deck, i: 0, flipped: false, firstTry: 0, missed: new Set(), requeue: {} });
  pickDir();
}
function pickDir() { cs.dirNow = randDir(); }
function frontHTML(c) {
  if (cs.dirNow === 'de') return `<div class="word">${wordHTML(c)}</div><div class="row">${sayBtn(c)}</div><div class="sub">${TYPE[c.type]}</div><div class="tap">Щракни върху картата, за да я обърнеш</div>`;
  return `<div class="word">${esc(c.bg)}</div><div class="sub">Как е на немски?${c.type === 'noun' ? ' С члена!' : ''}</div><div class="tap">Щракни върху картата, за да провериш</div>`;
}
function backHTML(c) {
  let dl = cs.dirNow === 'de' ? `<dt>Немски</dt><dd>${wordHTML(c)}</dd>` : `<dt>Превод</dt><dd>${esc(c.bg)}</dd>`;
  if (c.type === 'noun') dl += `<dt>Род</dt><dd>${c.art ? `<span class="art a-${c.art}">${GENDER[c.art]}</span>` : '—'}</dd><dt>Мн. ч.</dt><dd>${plural(c)}</dd>`;
  else dl += `<dt>Вид</dt><dd>${TYPE[c.type]}</dd>`;
  return `<div class="answer">${cs.dirNow === 'de' ? esc(c.bg) : wordHTML(c)}</div>
    <div class="row">${sayBtn(c)}</div>
    <dl class="details">${dl}</dl>${c.note ? `<p class="note">${ICON.info}<span><b>Запомни:</b> ${esc(c.note)}</span></p>` : ''}`;
}
function cardGlow(c) { return cs.flipped || cs.dirNow === 'de' ? (c.art || '') : ''; }
let flipping = false, leaving = false, lastShown = '';
function renderCards() {
  if (!cs.queue.length) newRound();
  if (!cs.queue.length) { view.innerHTML = emptyMsg(ui.hideKnown ? 'Всички думи от избраните лекции са научени. Махни „Без научените“, за да ги преговориш.' : NO_WORDS); setStatus('Няма карти'); return; }
  if (cs.i >= cs.queue.length) return renderSummary();
  const c = cs.queue[cs.i];
  const [sc, sl] = status(c);
  const rem = cs.queue.length - cs.i - 1;
  view.innerHTML = `<div class="stage">
    <div class="deckbar"><span>Карта <b>${pad(cs.i + 1)}</b> от ${pad(cs.queue.length)}</span><span class="xpbar" aria-hidden="true"><i style="width:${cs.i / cs.queue.length * 100}%"></i></span><span class="pill ${sc}">${sl}</span></div>
    <div class="deck">${rem >= 2 ? '<span class="ghost g2"></span>' : ''}${rem >= 1 ? '<span class="ghost g1"></span>' : ''}
      <div class="card${cs.flipped ? ' flipped' : ''}" id="card" role="group" aria-roledescription="флашкарта" aria-label="Карта ${cs.i + 1} от ${cs.queue.length}" data-g="${cardGlow(c)}">
        <div class="cardbar"><span>Л${c.l} · ${esc(c.catBg)} — карта ${pad(cs.i + 1)}.txt</span></div>
        <div class="cardbody"><div class="face front">${frontHTML(c)}</div><div class="face back">${backHTML(c)}</div></div>
      </div>
    </div>
    <div class="actions">
      <button class="xbtn big bad" data-act="miss">← Не знам</button>
      <button class="xbtn big flipbtn" data-act="flip">Обърни <kbd>Space</kbd></button>
      <button class="xbtn big good def" data-act="know">Знам →</button>
    </div>
    <div class="row sizerow">
      <label for="size">Карти в кръг:</label>
      <select class="xsel" id="size">${['10', '20', '40', 'all'].map(v => `<option value="${v}"${ui.size === v ? ' selected' : ''}>${v === 'all' ? 'Всички' : v}</option>`).join('')}</select>
      <button class="xbtn" data-act="reshuffle">Нов кръг</button>
      <span class="keys">Space обръща · ← не знам · → знам · S произношение</span>
    </div>
  </div>`;
  $('#size').addEventListener('change', e => { ui.size = e.target.value; saveUi(); newRound(); render(); });
  setStatus(`Карта ${cs.i + 1} от ${cs.queue.length} · Л${c.l} · ${c.catBg}`);
  const key = cs.i + '|' + c.id + '|' + cs.queue.length;
  const el = $('#card');
  if (key !== lastShown && !reduceMotion && el.animate) {
    el.animate([{ transform: 'translate(11px,11px)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }
  if (key !== lastShown) announce(`Карта ${cs.i + 1} от ${cs.queue.length}: ${cs.dirNow === 'de' ? c.de : c.bg}`);
  lastShown = key;
  if (cs.dirNow === 'de' && !cs.flipped) autoSay('c' + cs.i + c.id, c.de);
}
function flip() {
  const el = $('#card'); if (!el || flipping) return;
  const c = cs.queue[cs.i];
  const swap = () => {
    cs.flipped = !cs.flipped; el.classList.toggle('flipped', cs.flipped); el.dataset.g = cardGlow(c);
    announce(cs.flipped ? `Отговор: ${cs.dirNow === 'de' ? c.bg : c.de}` : `Лицева страна: ${cs.dirNow === 'de' ? c.de : c.bg}`);
    if (cs.flipped && cs.dirNow === 'bg') autoSay('b' + cs.i + c.id, c.de);
  };
  if (reduceMotion || !el.animate) { swap(); return; }
  flipping = true;
  const s = cs.flipped ? -1 : 1, P = 'perspective(1400px) ';
  el.classList.add('swapping');
  el.animate([{ transform: P + 'rotateY(0deg)' }, { transform: P + `rotateY(${90 * s}deg)` }], { duration: 150, easing: 'ease-in' }).finished
    .then(() => { swap(); return el.animate([{ transform: P + `rotateY(${-90 * s}deg)` }, { transform: P + 'rotateY(0deg)' }], { duration: 170, easing: 'ease-out' }).finished; })
    .catch(() => {}).finally(() => { el.classList.remove('swapping'); flipping = false; });
}
function cardAnswer(ok) {
  const c = cs.queue[cs.i]; if (!c || leaving) return;
  const el = $('#card');
  if (reduceMotion || !el || !el.animate) return answerNow(ok);
  leaving = true;
  el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${ok ? 60 : -60}px,40px) scale(.6)`, opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished
    .catch(() => {}).finally(() => { leaving = false; answerNow(ok); });
}
function answerNow(ok) {
  const c = cs.queue[cs.i]; if (!c) return;
  const retry = cs.requeue[c.id] || 0;
  mark(c, ok);
  if (ok) { if (!cs.missed.has(c.id)) cs.firstTry++; }
  else {
    cs.missed.add(c.id);
    if (retry < 2) { cs.requeue[c.id] = retry + 1; cs.queue.splice(Math.min(cs.i + 4, cs.queue.length), 0, c); }
  }
  cs.i++; cs.flipped = false; pickDir(); renderFilters(); render();
}
function renderSummary() {
  const unique = new Set(cs.queue.map(x => x.id)).size;
  const missed = [...cs.missed].map(id => byId[id]);
  const all = missed.length === 0;
  view.innerHTML = `<div class="stage"><div class="msgbox">${(all ? ICON.ok : ICON.info).replace('<svg', '<svg class="big"')}<div>
    <h2>${all ? 'Задачата е изпълнена успешно.' : 'Задачата се провали успешно.'}</h2>
    <p>Кръгът приключи. От първия път знаеше <b>${cs.firstTry} от ${unique}</b> карти.</p>
    ${missed.length ? `<p>Тези ще се паднат пак:</p><div class="misslist">${missed.map(c => `<span>${wordHTML(c)} — ${esc(c.bg)}</span>`).join('')}</div>` : '<p>Без нито една грешка.</p>'}
    <div class="row" style="justify-content:flex-start;margin-top:12px">
      ${missed.length ? '<button class="xbtn def" data-act="retryMissed" data-focus>Само грешните</button>' : ''}
      <button class="xbtn${missed.length ? '' : ' def'}" data-act="reshuffle"${missed.length ? '' : ' data-focus'}>Нов кръг</button>
    </div></div></div></div>`;
  setStatus('Кръгът приключи');
  announce(`Кръгът приключи. ${cs.firstTry} от ${unique} от първия път.`);
}

const qs = { c: null, dir: 'de', opts: [], picked: -1, right: 0, total: 0, streak: 0, best: 0 };
function newQuestion() {
  const c = pickWeighted(pool(), qs.c && qs.c.id);
  if (!c) { qs.c = null; return; }
  const dir = randDir();
  const key = x => dir === 'de' ? x.bg : x.de;
  const used = new Set([key(c)]);
  const take = list => { const out = []; for (const x of shuffle(list.slice())) { if (out.length >= 3) break; if (x.id === c.id || used.has(key(x))) continue; used.add(key(x)); out.push(x); } return out; };
  let d = take(CARDS.filter(x => x.l === c.l && x.cat === c.cat && x.type === c.type));
  if (d.length < 3) d = d.concat(take(CARDS.filter(x => x.type === c.type && x.l === c.l)).slice(0, 3 - d.length));
  if (d.length < 3) d = d.concat(take(CARDS.filter(x => x.type === c.type)).slice(0, 3 - d.length));
  Object.assign(qs, { c, dir, opts: shuffle([c, ...d]), picked: -1 });
}
function renderQuiz() {
  if (!qs.c) newQuestion();
  if (!qs.c) { view.innerHTML = emptyMsg(NO_WORDS); return; }
  const c = qs.c, done = qs.picked >= 0;
  const prompt = qs.dir === 'de'
    ? `<div class="word">${wordHTML(c)}</div><div class="row">${sayBtn(c)}</div><div class="sub">Избери превода</div>`
    : `<div class="word">${esc(c.bg)}</div><div class="sub">Избери немската дума</div>`;
  const opt = (x, i) => {
    let cls = '';
    if (done) cls = x.id === c.id ? ' right' : (i === qs.picked ? ' wrong' : ' dim');
    return `<button class="xbtn opt${cls}" data-act="choose" data-i="${i}"${done ? ' disabled' : ''}><kbd>${i + 1}</kbd><span>${qs.dir === 'de' ? esc(x.bg) : wordHTML(x)}</span></button>`;
  };
  const ok = done && qs.opts[qs.picked].id === c.id;
  const fb = done ? fbHTML(ok ? 'ok' : 'no', ok ? 'Вярно!' : 'Грешно.', `${wordHTML(c)} = ${esc(c.bg)}${c.type === 'noun' ? ` · мн. ч. ${plural(c)}` : ''}${!ok && c.note ? '<br>' + esc(c.note) : ''}`) : '<div class="fb"></div>';
  view.innerHTML = `<div class="stage">
    ${scoreHTML(qs.right, qs.total, `Серия: <b>${qs.streak}</b> · Рекорд: <b>${qs.best}</b>`)}
    <div class="prompt">${ghHTML(c)}${prompt}</div>
    <div class="opts">${qs.opts.map(opt).join('')}</div>
    ${fb}
    ${done ? nextHTML('nextQ') : ''}
    <p class="keys">Клавиши 1–4 за отговор · Enter за следващ. Думите, които бъркаш, се падат по-често.</p>
  </div>`;
  setStatus(`Тест · ${qs.right} от ${qs.total} точни`);
  if (!done && qs.dir === 'de') autoSay('q' + qs.total + c.id, c.de);
}
function choose(i) {
  if (qs.picked >= 0 || !qs.c) return;
  qs.picked = i; const ok = qs.opts[i].id === qs.c.id;
  qs.total++; if (ok) { qs.right++; qs.streak++; qs.best = Math.max(qs.best, qs.streak); } else qs.streak = 0;
  mark(qs.c, ok);
  if (qs.dir === 'bg') speak(qs.c.de);
  const right = qs.dir === 'de' ? qs.c.bg : qs.c.de;
  announce(ok ? 'Вярно!' : `Грешно. Правилно е: ${right}`);
  if (ok) { if (qs.streak > 0 && qs.streak % 5 === 0) balloon('Серия ' + qs.streak, 'Поредни верни отговори. Продължавай!', 'ok'); }
  else errorBox('Грешка', 'Неправилен отговор.', `Правилно: ${qs.c.de} = ${qs.c.bg}`);
  render();
  if (ok) timer = setTimeout(() => { newQuestion(); render(); }, 1100);
}

const ts = { c: null, res: null, hint: 0, val: '', right: 0, total: 0 };
const norm = s => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/…|\.\.\./g, ' ').replace(/[!?.,;:„“"'()]/g, ' ').replace(/\s+/g, ' ').trim();
function variants(c) {
  const full = new Set(), bare = new Set();
  const add = (set, s) => { const n = norm(s); if (n) set.add(n); };
  const base = c.de.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  [base, c.de.replace(/[()]/g, '')].forEach(v => { add(full, v); v.split(' / ').forEach(p => add(full, p)); });
  const paren = (c.de.match(/\((.*?)\)/) || [])[1];
  if (c.art) {
    const art = c.art === 'pl' ? 'die' : c.art;
    add(bare, c.stem.replace(/\s*\(.*?\)\s*/g, ' ').trim());
    if (paren) { add(full, art + ' ' + paren); add(bare, paren); }
  } else if (paren) add(full, paren);
  return { full, bare };
}
function newTypeQ() { Object.assign(ts, { c: pickWeighted(pool(), ts.c && ts.c.id), res: null, hint: 0, val: '' }); }
function hintText(c) {
  const t = c.de.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  return t.split(' ').map((w, i) => {
    if (i === 0 && c.art) return w;
    let k = 0; return w.replace(/[A-Za-zÄÖÜäöüß]/g, ch => (k++ < ts.hint ? ch : '_'));
  }).join('  ');
}
function renderType() {
  if (!ts.c) newTypeQ();
  if (!ts.c) { view.innerHTML = emptyMsg(NO_WORDS); return; }
  const c = ts.c, r = ts.res;
  const msg = r && {
    ok: ['ok', 'Вярно!'], typo: ['mid', 'Почти! Внимавай с правописа.'], hint: ['mid', 'Вярно, но с подсказка – ще се падне пак.'],
    noart: ['mid', 'Думата е вярна, но липсва членът!'], wrongart: ['no', 'Грешен член!'], wrong: ['no', 'Не е вярно.'], skip: ['no', 'Ето отговора:']
  }[r];
  const fb = r ? fbHTML(msg[0], msg[1], `${wordHTML(c)}${c.type === 'noun' ? ` · мн. ч. ${plural(c)}` : ''}${c.note ? '<br>' + esc(c.note) : ''}`) : '<div class="fb"></div>';
  view.innerHTML = `<div class="stage">
    ${scoreHTML(ts.right, ts.total, 'Пиши на немски · съществителните с член')}
    <div class="prompt">
      ${ghHTML(c, ' · ' + TYPE[c.type])}
      <div class="word">${esc(c.bg)}</div>
      ${ts.hint ? `<div class="hintline">${esc(hintText(c))}</div>` : ''}
      <div class="typerow"><label for="typeIn">Немски:</label><input class="xinput${r ? (['ok', 'typo', 'hint'].includes(r) ? ' ok' : ' no') : ''}" id="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${c.type === 'noun' ? 'напр. der Apfel' : ''}" value="${esc(ts.val)}"${r ? ' readonly' : ''}></div>
      <div class="umlauts">${['ä', 'ö', 'ü', 'ß'].map(u => `<button class="xbtn" data-act="ins" data-ch="${u}" aria-label="Вмъкни ${u}">${u}</button>`).join('')}</div>
      ${fb}
      <div class="row">
        ${r ? `<button class="xbtn def" data-act="nextT">Следваща <kbd>Enter</kbd></button>${sayBtn(c)}` :
        `<button class="xbtn def" data-act="check">Провери <kbd>Enter</kbd></button><button class="xbtn" data-act="hint">Подсказка</button><button class="xbtn" data-act="skip">Не знам</button>`}
      </div>
    </div>
    <p class="keys">Можеш да пишеш ae / oe / ue / ss вместо ä / ö / ü / ß.</p>
  </div>`;
  setStatus(`Напиши · ${ts.right} от ${ts.total} точни`);
  const inp = $('#typeIn');
  inp.addEventListener('input', () => { ts.val = inp.value; });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ts.res ? nextType() : checkType(); } });
  if (!r || document.activeElement === document.body) inp.focus({ preventScroll: true });
}
function checkType() {
  const c = ts.c, n = norm(ts.val); if (!n) return;
  const { full, bare } = variants(c);
  let r;
  if (full.has(n)) r = 'ok';
  else if (c.art && bare.has(n)) r = 'noart';
  else if (c.art && /^(der|die|das) /.test(n) && bare.has(n.slice(4))) r = 'wrongart';
  else if ([...full].some(v => v.length > 4 && lev(v, n) <= 1)) r = 'typo';
  else r = 'wrong';
  if (r === 'ok' && ts.hint) r = 'hint';
  ts.total++;
  if (r === 'ok' || r === 'typo') { ts.right++; mark(c, true); }
  else if (r === 'hint' || r === 'noart') touch(c);
  else { mark(c, false); errorBox('Грешка', r === 'wrongart' ? 'Грешен член.' : 'Неправилен отговор.', `Правилно: ${c.de}`); }
  ts.res = r; speak(c.de);
  announce(`${r === 'ok' || r === 'typo' ? 'Вярно' : r === 'wrong' || r === 'wrongart' ? 'Грешно' : 'Почти'}. Отговор: ${c.de}`);
  render();
}
function nextType() { newTypeQ(); render(); }

const as = { c: null, picked: null, right: 0, total: 0, streak: 0 };
const nounPool = () => pool().filter(c => c.art && c.art !== 'pl');
function ruleFor(c) {
  const s = c.stem;
  if (/chen$|lein$/.test(s)) return 'Окончание -chen / -lein → винаги das.';
  if (/ei$/.test(s) && c.art === 'die') return 'Окончание -ei → винаги die.';
  if (/(ung|heit|keit|schaft|ion|tät)$/.test(s)) return 'Окончания -ung, -heit, -keit, -schaft, -ion → die.';
  if (/(ik|ie)$/.test(s) && c.art === 'die') return 'Окончания -ik и -ie → обикновено die.';
  if (c.cat === 'Wochentage') return 'Дните от седмицата са der.';
  if (/ment$/.test(s)) return 'Окончание -ment → обикновено das.';
  if (/^Ge/.test(s) && c.art === 'das') return 'Ge- в началото → често das.';
  if (/e$/.test(s) && c.art === 'die') return 'Повечето думи на -e са die.';
  if (/er$/.test(s) && c.art === 'der') return 'Думи на -er за хора и уреди → често der.';
  return '';
}
function newArt() { as.c = pickWeighted(nounPool(), as.c && as.c.id); as.picked = null; }
function renderArticles() {
  if (!as.c) newArt();
  if (!as.c) { view.innerHTML = emptyMsg('Няма съществителни за тези филтри. Избери тема със съществителни.'); return; }
  const c = as.c, done = !!as.picked;
  const g = a => `<button class="xbtn gbtn ${a}${done && a === c.art ? ' hit' : ''}${done && a !== c.art ? ' fade' : ''}" data-act="art" data-a="${a}"${done ? ' disabled' : ''}>${a}<small>${{ der: '1 · мъжки', die: '2 · женски', das: '3 · среден' }[a]}</small></button>`;
  const ok = as.picked === c.art, rule = ruleFor(c);
  const fb = done ? fbHTML(ok ? 'ok' : 'no', `${ok ? 'Вярно!' : 'Грешно!'} ${wordHTML(c)}`, `мн. ч. ${plural(c)}${rule ? '<br>' + esc(rule) : ''}${c.note ? '<br>' + esc(c.note) : ''}`) : '<div class="fb"></div>';
  view.innerHTML = `<div class="stage">
    ${scoreHTML(as.right, as.total, `Серия: <b>${as.streak}</b>`)}
    <div class="prompt">${ghHTML(c)}<div class="word">${done ? wordHTML(c) : `<span class="art" style="color:#9A9A9A">___</span> ${esc(c.stem)}`}</div><div class="sub">${esc(c.bg)}</div>${done ? `<div class="row">${sayBtn(c)}</div>` : ''}</div>
    <div class="genders">${g('der')}${g('die')}${g('das')}</div>
    ${fb}
    ${done ? nextHTML('nextA') : ''}
    <details class="rules" id="rules">
      <summary>Правила за рода</summary>
      <div class="rg">
        <div><h3 class="a-der">der</h3><ul><li>дни от седмицата: der Montag</li><li>части от деня: der Morgen, der Abend</li><li>-er за хора и уреди: der Spitzer, der Lehrer</li><li>-ig: der Honig</li></ul></div>
        <div><h3 class="a-die">die</h3><ul><li>повечето на -e: die Schule, die Tomate</li><li>-ei: die Bäckerei, die Metzgerei</li><li>-ik, -ie: die Physik, die Biologie</li><li>-ung, -heit, -keit, -ion: die Religion</li></ul></div>
        <div><h3 class="a-das">das</h3><ul><li>-chen, -lein: das Brötchen, das Kaninchen</li><li>езици: das Deutsch, das Englisch</li><li>-ment: das Experiment</li><li>Ge-: das Gemüse</li></ul></div>
        <p><b>Сложни думи</b> вземат рода на последната част: der Markt → der Supermarkt, die Tasche → die Schultasche, das Buch → das Notizbuch.</p>
      </div>
    </details>
  </div>`;
  setStatus(`der · die · das · ${as.right} от ${as.total} точни`);
  try { if (localStorage.getItem('wortschatz-rules') !== '0') $('#rules').open = true; } catch (e) { $('#rules').open = true; }
  $('#rules').addEventListener('toggle', e => { try { localStorage.setItem('wortschatz-rules', e.target.open ? '1' : '0'); } catch (err) {} });
}
function pickArt(a) {
  if (as.picked || !as.c) return;
  as.picked = a; const ok = a === as.c.art;
  as.total++; if (ok) { as.right++; as.streak++; } else as.streak = 0;
  speak(as.c.de); announce(`${ok ? 'Вярно' : 'Грешно'}: ${as.c.de}`);
  if (!ok) errorBox('Грешка', 'Грешен член.', `Правилно: ${as.c.de}`);
  render();
  if (ok) timer = setTimeout(() => { newArt(); render(); }, 1200);
}

let listQuery = '';
function renderList() {
  const q = norm(listQuery);
  const cards = CARDS.filter(c => ui.lessons.includes(c.l) && (ui.cat === 'all' || ui.cat === c.l + '|' + c.cat) && (!q || norm(c.de).includes(q) || c.bg.toLowerCase().includes(listQuery.toLowerCase().trim())));
  let rows = '', last = '';
  cards.forEach(c => {
    const k = c.l + '|' + c.cat;
    if (k !== last) { last = k; rows += `<tr class="grp"><td colspan="5">${esc(c.catBg)} · Лекция ${c.l} (${esc(c.cat)})</td></tr>`; }
    const p = prog[c.id], st = !p ? '' : (p.b === 0 ? 'b0s' : 'b' + p.b), sl = status(c)[1];
    rows += `<tr><td><span class="st ${st}" role="img" aria-label="${sl}" title="${sl}"></span></td><td class="de">${wordHTML(c)}</td><td>${c.type === 'noun' ? plural(c) : '<span style="color:#999">—</span>'}</td><td>${esc(c.bg)}${c.note ? `<small>${esc(c.note)}</small>` : ''}</td><td>${sayBtn(c, true)}</td></tr>`;
  });
  view.innerHTML = `<div class="stage">
    <div class="search"><label for="q">Търсене:</label><input class="xinput" id="q" type="search" value="${esc(listQuery)}" style="max-width:320px"><span class="sub">${cards.length} обекта</span></div>
    ${cards.length ? `<div class="lv"><table><thead><tr><th style="width:28px"><span class="sr-only">Статус</span></th><th>Немски</th><th>Мн. ч.</th><th>Български</th><th style="width:44px"><span class="sr-only">Чуй</span></th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyMsg('Нищо не е намерено. Опитай с друга дума.')}
  </div>`;
  setStatus(`${cards.length} обекта`);
  const inp = $('#q');
  inp.addEventListener('input', () => { listQuery = inp.value; const pos = inp.selectionStart; renderList(); const n = $('#q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
}

view.addEventListener('click', e => {
  const s = e.target.closest('[data-say]');
  if (s) { e.stopPropagation(); speak(byId[s.dataset.say].de); return; }
  const a = e.target.closest('[data-act]');
  if (a) return ACTIONS[a.dataset.act](a);
  if (e.target.closest('#card')) flip();
});
const ACTIONS = {
  flip, check: checkType, nextT: nextType,
  know: () => cardAnswer(true),
  miss: () => cardAnswer(false),
  reshuffle: () => { newRound(); render(); },
  retryMissed: () => { newRound([...cs.missed].map(id => byId[id])); render(); },
  choose: a => choose(+a.dataset.i),
  nextQ: () => { newQuestion(); render(); },
  hint: () => { ts.hint++; render(); },
  skip: () => { ts.total++; mark(ts.c, false); ts.res = 'skip'; speak(ts.c.de); render(); },
  ins: a => {
    const inp = $('#typeIn'); if (!inp || inp.readOnly) return;
    const st = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? st;
    inp.value = inp.value.slice(0, st) + a.dataset.ch + inp.value.slice(en); ts.val = inp.value; inp.focus(); inp.setSelectionRange(st + 1, st + 1);
  },
  art: a => pickArt(a.dataset.a),
  nextA: () => { newArt(); render(); },
};
document.addEventListener('keydown', e => {
  if (modalOpen || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'Escape' && !smenu.hidden) { setMenu(false); startBtn.focus(); return; }
  if (win.hidden) return;
  const t = e.target;
  if (t.matches && t.matches('input, select, textarea')) return;
  if (t.matches && t.matches('button') && (e.key === ' ' || e.key === 'Enter')) return;
  const m = ui.mode;
  if (m === 'cards') {
    if (cs.i >= cs.queue.length) { if (e.key === 'Enter') { newRound(); render(); } return; }
    if (e.key === ' ') { e.preventDefault(); flip(); }
    else if (e.key === 'ArrowRight') cardAnswer(true);
    else if (e.key === 'ArrowLeft') cardAnswer(false);
    else if (e.key.toLowerCase() === 's' && cs.queue[cs.i]) speak(cs.queue[cs.i].de);
  } else if (m === 'quiz') {
    if (/^[1-4]$/.test(e.key)) choose(+e.key - 1);
    else if (e.key === 'Enter' && qs.picked >= 0) { clearTimeout(timer); newQuestion(); render(); }
    else if (e.key.toLowerCase() === 's' && qs.c && qs.dir === 'de') speak(qs.c.de);
  } else if (m === 'type') {
    if (e.key === 'Enter' && ts.res) nextType();
  } else if (m === 'articles') {
    const map = { '1': 'der', '2': 'die', '3': 'das' };
    if (map[e.key]) pickArt(map[e.key]);
    else if (e.key === 'Enter' && as.picked) { clearTimeout(timer); newArt(); render(); }
  }
});

if (!['cards', 'quiz', 'type', 'articles', 'list'].includes(ui.mode)) ui.mode = 'cards';
ui.lessons = (ui.lessons || []).filter(l => LESSONS.includes(l)); if (!ui.lessons.length) ui.lessons = [...LESSONS];
if (innerWidth > 640 && innerWidth < 900) win.classList.add('max');
if (innerWidth <= 640) $('#filterbox').open = false;
renderSound(); updateStats(); renderFilters(); render();
setTimeout(() => balloon('Добре дошли в Wortschatz', '380 думи от Лекции 1–4. Щракни „старт“ за всички програми.'), 700);
