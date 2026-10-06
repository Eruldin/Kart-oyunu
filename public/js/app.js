// ERULDIN: YANKILAR — app shell, screens, router.
import {t, tn, lang, setLang} from './i18n.js';
import * as audio from './audio.js';
import {connect, content} from './net.js';
import {cardEl, bindTooltip} from './cardview.js';
import * as Battle from './battle.js';
import * as FX from './fx.js';
import {chapters, defaultDeck, enemyDeck, cardById, ECHOES, CARDS, ACT_NAMES, KEYWORDS, GROUPS, RARITIES} from '../vendor/content/cards.mjs';

const ART = './assets/art/';
const app = () => document.querySelector('#app');
let backend = null, profile = null, screen = 'title';
let echoChoice = localStorage.getItem('eruldin.echo') || 'ash';
let sess = null;            // current battle session

// ---------------- screens ----------------
function showTitle() {
  screen = 'title';
  audio.music('menu');
  app().innerHTML = `
  <div class="title-screen">
    <img class="title-bg" src="${ART}keyart.jpg" alt="" data-depth="0.022">
    <div class="title-fog" data-depth="0.05"></div>
    ${FX.ambientHTML()}
    <div class="title-embers" id="title-embers" data-depth="0.10"></div>
    <div class="title-inner">
      <img class="title-sigil" src="./assets/ui/turn-token-v1.png" alt="">
      <h1 class="game-logo">ERULDIN</h1>
      <div class="game-sub">YANKILAR</div>
      <div class="title-rule"></div>
      <nav class="title-menu">
        <button class="btn primary big" data-act="play">${t(profile?.progress ? 'cont' : 'start')}</button>
        <button class="btn ghost" data-act="skirmish">${t('skirmish')}</button>
        <button class="btn ghost" data-act="collection">${t('collection')}</button>
        ${backend?.mode === 'server' ? `<button class="btn ghost" data-act="duel">${t('duel')}</button>` : ''}
      </nav>
      <div class="title-foot">
        <button class="txt" data-act="settings">${t('settings')}</button>
        <button class="txt" data-act="credits">${t('credits')}</button>
        <button class="txt" data-act="lang">${lang().toUpperCase()}</button>
      </div>
    </div>
    <div class="version">v0.2 · ${backend?.mode === 'server' ? t('online') : t('offline')}</div>
  </div>`;
  FX.embers(document.querySelector('#title-embers'), 26);
  FX.parallax(app().querySelector('.title-screen'));
}

let actTab = 0;
function showMap() {
  screen = 'map';
  audio.music('story');
  const prog = profile.progress ?? 0;
  actTab = Math.min(2, Math.max(0, Math.floor(prog / 20), actTab));
  // 20 nodes per act on a snake curve (4 rows × 5)
  const ACT_LEN = 20;
  const actChapters = chapters.map((ch, i) => ({ch, i})).filter(({ch}) => Math.floor((ch.id ?? 0) / 20) === actTab || (!ch.act && actTab === 0 && (ch.id ?? 0) < 20));
  // fallback: split by index when chapters lack act field
  const slice = chapters.map((ch, i) => ({ch, i})).slice(actTab * ACT_LEN, (actTab + 1) * ACT_LEN);
  const shown = slice.length ? slice : actChapters;
  const pts = shown.map((_, k) => {
    const row = Math.floor(k / 5), col = k % 5;
    const x = row % 2 === 0 ? 10 + col * 20 : 90 - col * 20;   // snake
    return [x, 16 + row * 22];
  });
  const routeD = pts.map((p, i) => {
    if (!i) return `M ${p[0]} ${p[1]}`;
    const [px, py] = pts[i - 1];
    const mx = (px + p[0]) / 2;
    return `Q ${mx} ${py + (Math.abs(py - p[1]) > 12 ? 10 : (i % 2 ? -10 : 10))}, ${p[0]} ${p[1]}`;
  }).join(' ');
  const doneInAct = shown.filter(({i}) => i < prog).length;
  app().innerHTML = `
  <div class="map-screen">
    <img class="map-bg" src="${ART}screens/campaign-map.png" alt="" data-depth="0.02">
    <div class="map-veil"></div>
    ${FX.ambientHTML()}
    <div class="map-embers" id="map-embers" data-depth="0.07"></div>
    <header class="map-head">
      <button class="icon-btn" data-act="title">←</button>
      <div><h1>${t('story')}</h1><p>${t('storyIntro')}</p></div>
      <button class="btn ghost" data-act="deck">${t('deck')}</button>
    </header>
    <nav class="act-tabs">
      ${[0, 1, 2].map(a => {
        const locked = prog < a * ACT_LEN;
        return `<button class="act-tab ${a === actTab ? 'sel' : ''} ${locked ? 'locked' : ''}" data-act-tab="${a}" ${locked ? 'disabled' : ''}>${tn(ACT_NAMES[a]) || (lang() === 'tr' ? `Perde ${a + 1}` : `Act ${a + 1}`)}</button>`;
      }).join('')}
    </nav>
    <div class="map-route">
      <svg class="map-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="route-path" d="${routeD}" vector-effect="non-scaling-stroke"/>
        <path class="route-path done" d="${routeD}" vector-effect="non-scaling-stroke" pathLength="${shown.length}" style="--done:${doneInAct}"/>
      </svg>
      ${shown.map(({ch, i}, k) => {
        const st = i < prog ? 'done' : i === prog ? 'next' : 'locked';
        const [x, y] = pts[k];
        const cls = st + (ch.type === 'boss' ? ' boss' : ch.type === 'tft' ? ' tft' : ch.type === 'elite' ? ' elite' : '');
        const glyph = ch.type === 'boss' ? '♛' : ch.type === 'tft' ? '♟' : ch.type === 'elite' ? '✦' : '';
        return `<button class="map-node ${cls}" data-ch="${i}" ${st === 'locked' ? 'disabled' : ''} style="left:${x}%;top:${y}%">
          <img class="node-medal" src="./assets/ui/story-${st === 'done' ? 'completed' : st === 'next' ? 'current' : 'locked'}-v1.png" alt="">
          ${glyph ? `<span class="node-glyph">${glyph}</span>` : ''}
          <span class="node-num">${i + 1}</span>
          <span class="node-name">${tn(ch.name)}</span>
        </button>`;
      }).join('')}
    </div>
    <div class="map-side">
      <div class="side-card">
        <h3>${t('chapterDone')}</h3>
        <div class="side-stat"><b>${prog}</b><span>/ ${chapters.length}</span></div>
        <div class="side-legend"><span><i class="lg boss">♛</i>${lang() === 'tr' ? 'Büyük Boss' : 'Boss'}</span><span><i class="lg tft">♟</i>TFT</span><span><i class="lg elite">✦</i>${lang() === 'tr' ? 'Elit' : 'Elite'}</span></div>
      </div>
      <div class="side-card">
        <h3>${t('chooseEcho')}</h3>
        <div class="echo-mini">${echoAvatar(echoChoice)}<b>${tn(ECHOES[echoChoice]?.name)}</b></div>
      </div>
    </div>
  </div>`;
  FX.embers(document.querySelector('#map-embers'), 18, 'ember-cold');
  FX.parallax(app().querySelector('.map-screen'));
}

function mutatorDesc(m) {
  const tr = lang() === 'tr';
  const parts = [];
  if (m.hpBonus) parts.push(tr ? `+${m.hpBonus} can` : `+${m.hpBonus} health`);
  if (m.shield) parts.push(tr ? `${m.shield} zırh` : `${m.shield} armor`);
  if (m.hatira) parts.push(tr ? `başta ${m.hatira} hatıra` : `starts with ${m.hatira} memory`);
  if (m.ozStart) parts.push(tr ? `+${m.ozStart} öz` : `+${m.ozStart} essence`);
  if (m.kwAll?.length) parts.push(m.kwAll.map(k => tn({tr: KEYWORDS[k]?.tr || k, en: KEYWORDS[k]?.en || k})).join(', '));
  return parts.join(' · ');
}

function echoAvatar(id) {
  const f = {ash: 'marcel.png', white: 'white.png', teom: 'teom.png'}[id] || 'marcel.png';
  return `<span class="echo-mini-ring"><img src="${ART}action/${f}" alt=""></span>`;
}

function showEchoSelect(next = 'map') {
  screen = 'echo';
  const unlocked = profile.echoes || ['ash'];
  app().innerHTML = `
  <div class="echo-screen">
    <header class="map-head"><button class="icon-btn" data-act="${next === 'map' ? 'map' : 'title'}">←</button><div><h1>${t('chooseEcho')}</h1><p>${t('chooseEchoSub')}</p></div><span></span></header>
    <div class="echo-grid">
      ${Object.values(ECHOES).map(e => {
        const locked = !unlocked.includes(e.id);
        return `<button class="echo-card ${e.id === echoChoice ? 'sel' : ''} ${locked ? 'locked' : ''}" data-echo="${e.id}" ${locked ? 'disabled' : ''}>
          <div class="echo-art"><img src="${ART}action/${echoAvatar(e.id).match(/action\/(.+?)"/)[1]}" alt=""></div>
          <div class="echo-body">
            <h2>${tn(e.name)}</h2><p class="echo-sub">${t('passive')}: ${tn(e.passiveText).split('.')[0].split(':')[0]}</p>
            <div class="ability"><b>${t('passive')}</b><p>${tn(e.passiveText)}</p></div>
            <div class="ability ult"><b>${t('ultimate')}: ${tn(e.ultimate?.name)}</b><p>${tn(e.ultimate?.text)}</p></div>
            ${locked ? `<div class="lock-tag">${t('locked')}</div>` : `<div class="sel-tag">${e.id === echoChoice ? t('selected') : t('select')}</div>`}
          </div>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function showChapterBrief(i) {
  const ch = chapters[i];
  audio.sfx('storyOpen');
  openModal(`
    <div class="brief">
      <div class="eyebrow">${t('chapter')} ${i + 1}${ch.type === 'boss' ? ' · ♛ BOSS' : ch.type === 'tft' ? ' · ♟ IZGARA SAVAŞI' : ch.type === 'elite' ? ' · ✦ ELİT' : ''}</div>
      <h2>${tn(ch.name)}</h2>
      <p class="brief-text">${tn(ch.intro)}</p>
      ${ch.type === 'tft' ? `<p class="brief-note">${lang() === 'tr' ? 'Bu karşılaşma ızgara savaşıdır — birimlerini diz, savaş otomatik çözülür.' : 'A grid battle — place your units, combat resolves itself.'}</p>` : ''}
      ${ch.mutators?.[1] && Object.keys(ch.mutators[1]).length ? `<p class="brief-note warn">${lang() === 'tr' ? 'Rakip avantajı: ' : 'Enemy advantage: '}${mutatorDesc(ch.mutators[1])}</p>` : ''}
      <div class="brief-meta">
        <div><small>${t('opponent')}</small><b>${esc(ch.opponent)}</b></div>
        <div><small>${t('hp')}</small><b>${ch.health}</b></div>
      </div>
      <div class="brief-echo">
        ${Object.values(ECHOES).filter(e => (profile.echoes || ['ash']).includes(e.id)).map(e =>
          `<button class="echo-pick ${e.id === echoChoice ? 'sel' : ''}" data-echo="${e.id}">${echoAvatar(e.id)}<span>${tn(e.name)}</span></button>`).join('')}
      </div>
      <button class="btn primary big" data-start="${i}">${t('enter')}</button>
    </div>`, 'brief-modal');
}

// ---------------- deck builder ----------------
let dbDraft = null, dbFilter = {group: '', kind: '', rarity: '', cost: ''};
function showDeck() {
  screen = 'deck';
  if (!dbDraft) dbDraft = [...(profile?.deck || [])];
  const col = profile?.collection || {};
  const counts = {};
  dbDraft.forEach(id => counts[id] = (counts[id] || 0) + 1);
  const pool = CARDS.filter(c => !c.token)
    .filter(c => !dbFilter.group || c.group === dbFilter.group)
    .filter(c => !dbFilter.kind || c.kind === dbFilter.kind)
    .filter(c => !dbFilter.rarity || (c.rarity || 'common') === dbFilter.rarity)
    .filter(c => dbFilter.cost === '' || String(c.cost) === dbFilter.cost)
    .sort((a, b) => a.cost - b.cost || tn(a.name).localeCompare(tn(b.name), 'tr'));
  const deckRows = Object.entries(counts)
    .map(([id, n]) => ({c: cardById[id], n}))
    .filter(x => x.c)
    .sort((a, b) => a.c.cost - b.c.cost || tn(a.c.name).localeCompare(tn(b.c.name), 'tr'));
  const valid = dbDraft.length === 20;
  app().innerHTML = `
  <div class="db-screen">
    <header class="map-head">
      <button class="icon-btn" data-act="map">←</button>
      <div><h1>${t('deckBuild')}</h1><p>${t('pityInfo')}</p></div>
      <div class="db-head-actions">
        <span class="shard-pill in">◆ ${profile?.shards ?? 0}</span>
        <span class="db-count ${valid ? 'ok' : ''}">${dbDraft.length}/20</span>
        <button class="btn ghost" id="db-clear">${t('deckClear')}</button>
        <button class="btn primary" id="db-save" ${valid ? '' : 'disabled'}>${t('deckSave')}</button>
      </div>
    </header>
    <div class="db-body">
      <aside class="db-filters">
        ${selFilter('group', t('filterGroup'), GROUPS)}
        ${selFilter('kind', t('filterType'), {unit: {tr: t('unit'), en: t('unit')}, hero: {tr: t('hero'), en: t('hero')}, spell: {tr: t('spell'), en: t('spell')}})}
        ${selFilter('rarity', t('filterRarity'), Object.fromEntries(Object.keys(RARITIES).map(r => [r, {tr: t('rarity_' + r), en: t('rarity_' + r)}])))}
        <label class="db-f"><span>${t('filterCost')}</span>
          <select data-f="cost"><option value="">${t('filterAll')}</option>${[0,1,2,3,4,5,6,7,8,9].map(c => `<option ${dbFilter.cost === String(c) ? 'selected' : ''}>${c}</option>`).join('')}</select>
        </label>
      </aside>
      <div class="db-pool">
        ${pool.map(c => {
          const owned = col[c.id] || 0, used = counts[c.id] || 0;
          const can = owned > used && used < 3 && dbDraft.length < 20;
          return `<div class="db-card ${can ? '' : 'cant'} ${owned ? '' : 'unowned'}" data-db-add="${c.id}">
            <i class="db-owns ${used ? 'in' : ''}">${used}/${owned}</i>
          </div>`;
        }).join('')}
      </div>
      <aside class="db-list">
        ${deckRows.length ? deckRows.map(({c, n}) => `
          <div class="db-row" data-db-del="${c.id}">
            <span class="db-cost">${c.cost}</span>
            <span class="db-name">${tn(c.name)}</span>
            <span class="db-n">×${n}</span>
          </div>`).join('') : `<p class="db-empty">${t('empty')}</p>`}
      </aside>
    </div>
  </div>`;
  // card thumbnails
  app().querySelectorAll('.db-card').forEach(el => {
    el.prepend(cardEl(cardById[el.dataset.dbAdd]));
  });
  // events
  app().querySelectorAll('[data-f]').forEach(sel => sel.addEventListener('change', e => { dbFilter[e.target.dataset.f] = e.target.value; showDeck(); }));
  app().querySelectorAll('[data-db-add]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.dbAdd, owned = col[id] || 0, used = counts[id] || 0;
    if (owned > used && used < 3 && dbDraft.length < 20) { dbDraft.push(id); audio.sfx('cardPlace'); showDeck(); }
    else audio.sfx('uiError');
  }));
  app().querySelectorAll('[data-db-del]').forEach(el => el.addEventListener('click', () => {
    const i = dbDraft.indexOf(el.dataset.dbDel);
    if (i >= 0) { dbDraft.splice(i, 1); audio.sfx('uiClick'); showDeck(); }
  }));
  $('#db-clear').addEventListener('click', () => { dbDraft = []; showDeck(); });
  $('#db-save').addEventListener('click', async () => {
    try {
      profile = await backend.saveDeck(dbDraft);
      toast(t('deckOk')); audio.sfx('uiConfirm'); dbDraft = null;
    } catch (e) { toast(t('deckErr')); }
  });
}
function selFilter(key, label, dict) {
  return `<label class="db-f"><span>${label}</span><select data-f="${key}">
    <option value="">${t('filterAll')}</option>
    ${Object.entries(dict).map(([k, v]) => `<option value="${k}" ${dbFilter[key] === k ? 'selected' : ''}>${tn(v)}</option>`).join('')}
  </select></label>`;
}
function $ (s) { return document.querySelector(s); }

function showCollection() {
  screen = 'collection';
  audio.music('story');
  const col = profile?.collection || {};
  const owned = Object.values(col).filter(n => n > 0).length;
  const total = CARDS.filter(c => !c.token).length;
  const ownedCopies = Object.values(col).reduce((a, b) => a + b, 0);
  app().innerHTML = `
  <div class="coll-screen">
    <header class="map-head"><button class="icon-btn" data-act="title">←</button><div><h1>${t('collection')}</h1><p>${t('collStats')}</p></div><span class="shard-pill">◆ ${profile?.shards ?? 0}</span></header>
    <div class="coll-stats">
      <div class="cstat"><b>${owned}</b><span>/ ${total} ${t('owned').toLowerCase()}</span></div>
      <div class="cstat"><b>${ownedCopies}</b><span>${t('copies')}</span></div>
      <div class="cstat pity"><b>${'◆'.repeat(Math.min(6, profile?.pity || 0)) || '—'}</b><span>${t('pityInfo')}</span></div>
    </div>
    <div class="coll-grid">
      ${CARDS.filter(c => !c.token).map(c => {
        const n = col[c.id] || 0;
        return `<div class="coll-card ${n ? '' : 'unowned'}" data-inspect="${c.id}">${n ? `<i class="own-badge">×${n}</i>` : ''}</div>`;
      }).join('')}
    </div>
  </div>`;
  app().querySelectorAll('.coll-card').forEach(el => el.append(cardEl(cardById[el.dataset.inspect])));
}

function showSettings() {
  const v = audio.vols();
  openModal(`
    <div class="settings">
      <h2>${t('settings')}</h2>
      <label class="set-row"><span>${t('sound')}</span><input type="range" id="set-sfx" min="0" max="1" step="0.05" value="${v.sfxVol}"></label>
      <label class="set-row"><span>${t('music')}</span><input type="range" id="set-mus" min="0" max="1" step="0.05" value="${v.musVol}"></label>
      <label class="set-row"><span>${t('motion')}</span><input type="checkbox" id="set-motion" ${document.documentElement.classList.contains('reduced') ? 'checked' : ''}></label>
      <label class="set-row"><span>${t('lang')}</span>
        <select id="set-lang"><option value="tr" ${lang() === 'tr' ? 'selected' : ''}>Türkçe</option><option value="en" ${lang() === 'en' ? 'selected' : ''}>English</option></select>
      </label>
      <label class="set-row"><span>${t('fullscreen')}</span><input type="checkbox" id="set-fs" ${document.fullscreenElement ? 'checked' : ''}></label>
    </div>`, 'settings-modal');
}
function showCredits() {
  openModal(`<div class="credits"><h2>${t('credits')}</h2>
    <p>${t('musicCredit')}</p><p>${t('artCredit')}</p><p>${t('engineCredit')}</p>
    <p class="dim">© Eruldin Destanı</p></div>`, 'credits-modal');
}
function showHelp() {
  openModal(`<div class="help"><h2>${t('help')}</h2><ol>${[1, 2, 3, 4].map(i => `<li>${t('howTo' + i)}</li>`).join('')}</ol></div>`, 'help-modal');
}
function showDuel() {
  openModal(`<div class="duel"><h2>${t('duel')}</h2>
    <button class="btn primary" id="duel-create">${t('createRoom')}</button>
    <div class="duel-join"><input id="duel-code" maxlength="6" inputmode="numeric" placeholder="${t('roomCode')}"><button class="btn ghost" id="duel-join">${t('joinRoom')}</button></div>
  </div>`, 'duel-modal');
  $('#duel-create')?.addEventListener('click', async () => {
    try {
      const r = await backend.createRoom(echoChoice);
      document.querySelector('.duel').innerHTML = `<h2>${t('duel')}</h2><div class="room-code">${r.code}</div><p>${t('waiting')}</p><small>${t('share')}</small><button class="btn ghost" id="duel-cancel">${t('cancelRoom')}</button>`;
      document.querySelector('#duel-cancel')?.addEventListener('click', async () => { await backend.cancelRoom(); closeModal(); });
    } catch (e) { toast(e.message); }
  });
  document.querySelector('#duel-join')?.addEventListener('click', async () => {
    try {
      const m = await backend.joinRoom(document.querySelector('#duel-code').value.trim(), echoChoice);
      if (m?.matchId) { closeModal(); enterMatch(m); }
    } catch (e) { toast(e.message); }
  });
}

// ---------------- match lifecycle ----------------
async function enterMatch(payload) {
  // payload: {matchId, actor, state, names, kind, chapter} — state is a view
  sess = {
    matchId: payload.matchId, actor: payload.actor ?? 0,
    names: payload.names, kind: payload.kind, chapter: payload.chapter,
    view: payload.state, reward: payload.reward || null,
    backend: {
      command: async cmd => {
        if (backend.mode === 'server') {
          const r = await backend.command(cmd);
          if (r.profile) profile = r.profile;
          return {state: r.state};
        }
        return backend.command(cmd); // local returns pack() {matchId,actor,state,...}
      },
    },
    onLeave: () => { Battle.destroyBattle(); sess = null; showMap(); audio.music('story'); },
    onRematch: async () => { if (payload.kind === 'story') await launchStory(payload.chapter); else await launchSkirmish(); },
  };
  screen = 'battle';
  Battle.startBattle(sess);
}
async function launchStory(i) {
  try {
    const m = backend.mode === 'server' ? await backend.startStoryAndBind(i, echoChoice) : await backend.startStory(i, echoChoice);
    enterMatch(m);
  } catch (e) { toast(e.message); }
}
async function launchSkirmish() {
  const m = await backend.startSkirmish(echoChoice, ['ash', 'white', 'teom'][(Math.random() * 3) | 0]);
  enterMatch(m);
}

// server SSE / local emit → route into battle when ours
function onServerEvent(m) {
  if (!m?.matchId || !sess) return;
  if (m.matchId !== sess.matchId) return;
  if (m.profile) profile = m.profile;
  if (m.reward) sess.reward = m.reward;
  Battle.updateBattle(m.state);
  if (m.state?.winner !== null && m.state?.phase === 'over') {/* result rendered by battle */}
}

// ---------------- modal/toast helpers ----------------
const modalRoot = () => document.querySelector('#modal-root');
function openModal(html, cls = '') {
  modalRoot().innerHTML = `<div class="modal-veil" id="mveil"><section class="modal ${cls}"><button class="icon-btn modal-x" id="mx">✕</button>${html}</section></div>`;
  document.querySelector('#mveil').addEventListener('click', e => { if (e.target.id === 'mveil') closeModal(); });
  document.querySelector('#mx').addEventListener('click', closeModal);
}
function closeModal() { modalRoot().innerHTML = ''; }
export function toast(msg) {
  const el = document.querySelector('#toast');
  el.textContent = msg; el.classList.add('visible');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('visible'), 3200);
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// ---------------- global click router ----------------
document.addEventListener('click', async e => {
  const el = e.target.closest('button,[data-act],[data-ch],[data-echo],[data-inspect],[data-act-tab]');
  if (!el) return;
  const act = el.dataset.act;
  if (act) {
    audio.sfx('uiClick');
    if (act === 'play') showMap();
    else if (act === 'skirmish') launchSkirmish();
    else if (act === 'collection') showCollection();
    else if (act === 'duel') showDuel();
    else if (act === 'settings') showSettings();
    else if (act === 'credits') showCredits();
    else if (act === 'title') showTitle();
    else if (act === 'map') showMap();
    else if (act === 'deck') showDeck();
    else if (act === 'lang') { setLang(lang() === 'tr' ? 'en' : 'tr'); rerender(); }
    return;
  }
  if (el.dataset.actTab !== undefined) { actTab = +el.dataset.actTab; showMap(); return; }
  if (el.dataset.ch) { showChapterBrief(+el.dataset.ch); return; }
  if (el.dataset.echo) { echoChoice = el.dataset.echo; localStorage.setItem('eruldin.echo', echoChoice); audio.sfx('uiConfirm'); if (modalRoot().firstChild) showChapterBrief(currentBrief); else showEchoSelect(); return; }
  if (el.dataset.start) { closeModal(); await launchStory(+el.dataset.start); return; }
  if (el.dataset.inspect) { inspectCard(el.dataset.inspect); return; }
});
let currentBrief = 0;
const _brief = showChapterBrief;
showChapterBrief = i => { currentBrief = i; _brief(i); };

function inspectCard(id) {
  const c = cardById[id];
  openModal(`<div class="inspect"><div class="inspect-card"></div><div class="inspect-info">
    <h2>${tn(c.name)}</h2><div class="tag">${t(c.kind)} · ${c.cost} ${t('oz')}</div>
    <p>${tn(c.text)}</p>${(c.kw || []).map(k => `<div class="ability"><b>${t('kw_' + k)}</b><p>${t('kw_h_' + k)}</p></div>`).join('')}
    ${c.flavor ? `<em class="flavor">${tn(c.flavor)}</em>` : ''}
  </div></div>`, 'inspect-modal');
  document.querySelector('.inspect-card').append(cardEl(c));
}

// settings inputs (delegated)
document.addEventListener('input', e => {
  if (e.target.id === 'set-sfx') audio.setSfxVol(+e.target.value);
  if (e.target.id === 'set-mus') audio.setMusVol(+e.target.value);
});
document.addEventListener('change', e => {
  if (e.target.id === 'set-motion') { document.documentElement.classList.toggle('reduced', e.target.checked); localStorage.setItem('eruldin.motion', e.target.checked ? '1' : '0'); }
  if (e.target.id === 'set-lang') { setLang(e.target.value); rerender(); }
  if (e.target.id === 'set-fs') { e.target.checked ? document.documentElement.requestFullscreen?.() : document.exitFullscreen?.(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function rerender() {
  ({title: showTitle, map: showMap, echo: () => showEchoSelect(), deck: showDeck, collection: showCollection}[screen] || showTitle)();
}

// ---------------- boot ----------------
async function boot() {
  document.documentElement.classList.toggle('reduced', localStorage.getItem('eruldin.motion') === '1');
  audio.unlock();
  const res = await connect();
  backend = res.backend;
  profile = res.profile;
  echoChoice = profile.echoes?.includes(echoChoice) ? echoChoice : (profile.echoes?.[0] || 'ash');
  if (backend.mode === 'server') backend.onEvent(onServerEvent);
  else backend.onEvent(m => { if (sess && m.matchId === sess.matchId) Battle.updateBattle(m.state); });
  bindTooltip(cardById);
  // resume an in-flight match (server mode)
  if (res.active?.matchId) { enterMatch(res.active); return; }
  showTitle();
}
boot().catch(e => {
  app().innerHTML = `<div class="boot"><strong>ERULDIN</strong><em>${esc(e.message)}</em><button class="btn primary" onclick="location.reload()">↻</button></div>`;
});
