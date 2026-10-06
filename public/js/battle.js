// Battle screen — LoR-style board: frames, drag&drop, combat lanes, stack, FX.
import {t, tn, lang} from './i18n.js';
import {cardEl, boardEl, frameKind, LAYOUT} from './cardview.js';
import {sfx, music, duck} from './audio.js';
import * as FX from './fx.js';
import {cardById, ECHOES} from '../vendor/content/cards.mjs';

const ART = './assets/art/';
let session = null;          // {backend, matchId, actor, names, kind, chapter, onLeave, onFinish}
let view = null;             // latest viewFor() state (players' hands masked)
let selectedAttackers = new Set();
let blockPairs = {};         // attackerIdx -> my board slot
let blockFocus = null;       // attacker idx currently being assigned
let targetMode = null;       // {handIdx, def} awaiting target pick
let seenEvents = [];
let busy = false;

const $ = s => document.querySelector(s);
const actor = () => session?.actor ?? 0;
const me = () => view.players[actor()];
const foe = () => view.players[1 - actor()];
const myTurn = () => view.phase === 'action' && view.active === actor();

export async function startBattle(sess) {
  destroyBattle();
  session = sess;
  view = sess.view;
  seenEvents = [];
  selectedAttackers.clear(); blockPairs = {}; blockFocus = null; targetMode = null;
  initTutorial();
  music('battle');
  render();
  animateNew();
}

export function updateBattle(v) {
  view = v;
  if (!$('.battle')) return; // match panel not mounted; app routes us
  render();
  animateNew();
}

// ---------------- render ----------------
function render() {
  const root = document.querySelector('#app');
  const s = view;
  const A = actor();
  const isBlockDefend = s.phase === 'block' && s.token !== A;
  const isMulligan = s.phase === 'mulligan';
  const winner = s.winner;

  root.innerHTML = `
  <div class="battle ${s.phase === 'block' ? 'in-combat' : ''} ${targetMode ? 'targeting' : ''} ${s.token === actor() && !me().flag?.attacked ? 'my-token' : ''}" id="battle">
    <div class="bfield" id="bfield">
      <div class="bfield-bg" data-depth="0.02"></div>
      <div class="bfield-mist" data-depth="0.035"></div>
      ${FX.ambientHTML()}
      <div class="bfield-embers" id="bfield-embers" data-depth="0.08"></div>
      <div class="bfield-glowline"></div>

      <!-- enemy plate -->
      <div class="plate foe-plate">
        ${avatarHTML(foe(), true)}
        <div class="foe-hand" title="${t('enemyHand')}">${(foe().hand || []).map(() => `<img class="card-back-mini" src="${ART}card-back.png" alt="">`).join('')}<span class="foe-hand-n">${(foe().hand || []).length}</span></div>
        <div class="foe-echo-pool">${foe().echoPool ? `<small>${t('kw_yanki')} ↺ ${foe().echoPool}</small>` : ''}</div>
      </div>

      <!-- enemy board -->
      <div class="brow foe-row" id="foe-row">
        ${foe().board.map((u, i) => `<div class="bslot" data-slot="${i}" data-side="foe"></div>`).join('')}
        ${'<div class="bslot ghost"></div>'.repeat(Math.max(0, 6 - foe().board.length))}
      </div>

      <!-- combat line -->
      <div class="combat-line" id="combat-line">
        <div class="round-pill"><span>${t('round')}</span><b>${s.round}</b></div>
        <div class="token-pill ${s.token === A ? 'mine' : ''}">${s.token === A ? '⚔ ' + t('attack') : '⚔ ' + tn({tr: 'Rakip', en: 'Enemy'})}</div>
        <div class="stack-zone" id="stack-zone">
          ${s.stack.map((it, i) => stackCardHTML(it, i)).join('')}
        </div>
      </div>

      <!-- my board -->
      <div class="brow my-row" id="my-row">
        ${me().board.map((u, i) => `<div class="bslot" data-slot="${i}" data-side="me"></div>`).join('')}
        ${'<div class="bslot ghost drop-slot"></div>'.repeat(Math.max(0, 6 - me().board.length))}
      </div>

      <!-- my plate -->
      <div class="plate my-plate">
        ${avatarHTML(me(), false)}
        <div class="res-col">
          <div class="res oz" title="${t('oz')}">${gemRow(me().oz, 10, 'oz')}</div>
          <div class="res ani" title="${t('ani')}">${gemRow(me().ani, 3, 'ani')}</div>
          <div class="res hatira" title="${t('hatira')}">${gemRow(me().avatar.hatira, 6, 'hat')}</div>
          <div class="res deck-count" title="${t('deckN')}">${me().deck} ⬧ ${me().dead?.length || 0}</div>
        </div>
        ${ultHTML()}
      </div>

      <!-- action bar -->
      <div class="action-bar">
        <div class="hint" id="hint">${hintText()}</div>
        <div class="actions">
          ${s.stack.length && stackResponder() === A ? `<button class="btn ghost" id="btn-decline">${t('decline')}</button>` : ''}
          ${isBlockDefend ? `<button class="btn primary big" id="btn-block">${Object.keys(blockPairs).length ? t('block') : t('noBlock')}</button>` : ''}
          ${myTurn() && s.token === A && !me().flag?.attacked && !targetMode ? `<button class="btn war ${selectedAttackers.size ? 'big pulse' : ''}" id="btn-attack" ${selectedAttackers.size ? '' : 'disabled'}>${t('attack')} <b>${selectedAttackers.size || ''}</b></button>` : ''}
          <button class="btn ${myTurn() ? 'primary big pulse-soft' : 'ghost'}" id="btn-pass" ${myTurn() || stackResponder() === A ? '' : 'disabled'}>${myTurn() ? t('endTurn') : t('pass')}</button>
        </div>
      </div>

      <!-- hand -->
      <div class="hand" id="hand"></div>

      <!-- top bar -->
      <div class="battle-top">
        <button class="icon-btn" id="btn-quit" title="${t('concede')}">✕</button>
        <div class="btitle">${session.kind === 'story' ? tn({tr: `Bölüm ${session.chapter + 1}`, en: `Chapter ${session.chapter + 1}`}) : t(session.kind)}</div>
        <div class="blog-toggle" id="btn-log">${t('log')}</div>
      </div>
      <div class="battle-log" id="battle-log"></div>
    </div>
    ${isMulligan ? mulliganHTML() : ''}
    ${winner !== null && winner !== undefined ? resultHTML() : ''}
  </div>`;

  mountUnits();
  mountHand();
  drawCombatArrows();
  bindInteractions();
  renderLog();
  FX.embers($('#bfield-embers'), 24);
  FX.parallax($('#bfield'));
  tutorTick();
}

function drawCombatArrows() {
  FX.clearArrows();
  const s = view;
  const A = actor();
  // attack-preview: picked units aim at the enemy avatar before committing (LoR-style)
  if (myTurn() && s.token === A && !me().flag?.attacked) {
    for (const uid of selectedAttackers) {
      const uEl = uidEl(A, uid);
      const av = avatarEl(1 - A);
      if (uEl && av) FX.arrow(uEl, av, '#e0705c', true);
    }
  }
  // pending spell stack: pale-blue lines from each stack card to its target (LoR target lines)
  if (s.stack?.length) {
    s.stack.forEach((it, i) => {
      if (!it.target) return;
      const sc = document.querySelector(`.stack-card[data-idx="${i}"]`);
      const tEl = it.target.kind === 'avatar' ? avatarEl(it.target.a) : unitEl(it.target.a, it.target.slot);
      if (sc && tEl) FX.arrow(sc, tEl, '#7fb0ff', true);
    });
  }
  if (s.phase !== 'block' || !s.combat) return;
  s.combat.attackers.forEach((atk, i) => {
    const uEl = uidEl(s.token, atk.uid);
    if (!uEl) return;
    if (blockPairs[i] !== undefined && blockPairs[i] !== null && me().board[blockPairs[i]]) {
      const dEl = unitEl(A, blockPairs[i]);
      if (dEl) { FX.arrow(dEl, uEl, '#9fd8f0', true); uEl.classList.add('blocked'); }
    } else {
      const av = avatarEl(1 - s.token); // arrows aim at the defender's avatar
      if (av) FX.arrow(uEl, av, '#e0705c');
    }
  });
}

function avatarHTML(p, enemy) {
  const echo = ECHOES[p.avatar.echo] || {};
  const hpPct = Math.max(0, p.avatar.hp / p.avatar.max * 100);
  return `
  <div class="avatar ${enemy ? 'enemy targetable-avatar' : ''}" data-avatar="${enemy ? 'foe' : 'me'}">
    <div class="avatar-ring"></div>
    <img class="avatar-img" src="${enemy ? foeAvatarArt() : ART + 'action/' + echoArt(p.avatar.echo)}" onerror="this.src='${ART}akhenten.jpg'" alt="">
    <div class="avatar-hp"><b>${p.avatar.hp}</b><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" pathLength="100" stroke-dasharray="${hpPct} 100"/></svg></div>
    <div class="avatar-meta"><strong>${enemy ? foeName() : tn(echo.name)}</strong></div>
  </div>`;
}
function foeName() {
  if (session.kind === 'story') return session.names?.[1 - actor()] ?? t('opponent');
  return session.names?.[1 - actor()] ?? t('opponent');
}
function echoArt(echoId) {
  return {ash: 'marcel.png', white: 'white.png', teom: 'teom.png'}[echoId] || 'marcel.png';
}
const CHAPTER_FOE_ART = {
  0: 'art/enemies/karah-crawler-concept-v3.png',
  1: 'art/enemies/council-concept-v3.png',
  2: 'art/enemies/korvengrad-watch-concept-v3.png',
  3: 'art/action/white.png',
  4: 'art/action/teom.png',
};
function foeAvatarArt() {
  if (session.kind === 'story' && CHAPTER_FOE_ART[session.chapter] != null) return ART.replace('art/', '') + CHAPTER_FOE_ART[session.chapter];
  return ART + 'action/' + echoArt(foe().avatar.echo);
}
function gemRow(n, cap, cls) {
  let h = '';
  for (let i = 0; i < cap; i++) h += `<i class="${i < n ? 'on' : ''}"></i>`;
  return `<span class="gems ${cls}">${h}</span><b>${n}</b>`;
}
function ultHTML() {
  const av = me().avatar;
  const echo = ECHOES[av.echo];
  if (!echo?.ultimate) return '';
  const ready = av.hatira >= 6 && !av.ultUsed;
  return `<button class="ult ${ready ? 'ready' : ''} ${av.ultUsed ? 'spent' : ''}" id="btn-ult" ${ready && myTurn() ? '' : 'disabled'} title="${tn(echo.ultimate.name)} — ${tn(echo.ultimate.text)}">
    <span class="ult-gem"></span>
    <span class="ult-label">${av.ultUsed ? t('ultUsed') : ready ? t('ultimateReady') : `${av.hatira}/6`}</span>
  </button>`;
}
function stackCardHTML(it, i) {
  const def = cardById[it.card];
  const mine = it.owner === actor();
  return `<div class="stack-card ${mine ? 'mine' : 'theirs'}" data-card-id="${it.card}" data-idx="${i}" style="--i:${i}">
    <img src="${ART}${(def?.art || 'karah.png').replace(/\.\w+$/, '.jpg')}" alt="">
    <b>${def ? tn(def.name) : it.card}</b>
  </div>`;
}
function hintText() {
  const s = view, A = actor();
  if (targetMode) return t('targetHint');
  if (s.phase === 'mulligan') return t('mulliganSub');
  if (s.phase === 'block' && s.token !== A) return t('blockHint');
  if (s.stack.length && stackResponder() === A) return t('stackHint');
  if (myTurn()) return selectedAttackers.size ? t('attackHint') : t('playHint');
  return t('enemyTurn');
}
// who may respond to the stack now: in engine the responder is state.active when stack open
function stackResponder() { return view.stack.length ? view.active : -1; }

function mulliganHTML() {
  const done = me().mulliganDone;
  return `<div class="mulligan-veil">
    <div class="mull-box">
      <h2>${t('mulligan')}</h2>
      <p>${done ? t('waitEnemy') : t('mulliganSub')}</p>
      <div class="mull-cards" id="mull-cards"></div>
      ${done ? '<div class="wait-pulse"></div>' : `<button class="btn primary big" id="btn-mulligan">${t('confirm')}</button>`}
    </div>
  </div>`;
}
const mullSel = new Set();

function resultHTML() {
  const w = view.winner;
  const win = w === actor(), draw = w === 'draw';
  const ch = session.kind === 'story' && win;
  return `<div class="result-veil">
    <div class="result-box ${win ? 'win' : draw ? 'draw' : 'lose'}">
      <div class="result-glow"></div>
      <h1>${t(draw ? 'draw' : win ? 'victory' : 'defeat')}</h1>
      <p>${t(draw ? 'drawSub' : win ? 'victorySub' : 'defeatSub')}</p>
      ${ch ? `<p class="unlock">${t('nextChapter')}</p>` : ''}
      ${win && session.reward ? rewardHTML(session.reward) : ''}
      <div class="result-actions">
        <button class="btn primary big" id="btn-tomap">${t('toMap')}</button>
        ${!win ? `<button class="btn ghost" id="btn-rematch">${t('rematch')}</button>` : ''}
      </div>
    </div>
  </div>`;
}

function rewardHTML(rw) {
  const cards = (rw.cards || []).map(id => {
    const c = cardById[id];
    const r = c?.rarity || 'common';
    return `<div class="drop-card r-${r}">
      <div class="drop-art"><img src="${ART}${(c?.art || 'gen/direnis-1.png').replace(/\.\w+$/, '.jpg')}" alt=""></div>
      <b>${tn(c?.name)}</b>
      <i>${t('rarity_' + r)}</i>
    </div>`;
  }).join('');
  return `<div class="reward-box ${rw.legendary ? 'leg' : ''}">
    ${rw.legendary ? `<div class="legendary-banner">${t('legendaryDrop')}</div>` : ''}
    <div class="drop-row">${cards}</div>
    ${rw.shards ? `<div class="shard-row"><span class="shard-ico">◆</span>+${rw.shards} ${t('shards')}</div>` : ''}
  </div>`;
}

// ---------------- mounts ----------------
function mountUnits() {
  for (const [sideKey, side] of [['me', me()], ['foe', foe()]]) {
    const row = side === me() ? $('#my-row') : $('#foe-row');
    row.querySelectorAll(`.bslot[data-side="${sideKey === 'me' ? 'me' : 'foe'}"]`).forEach(slot => {
      const u = side.board[+slot.dataset.slot];
      if (!u) return;
      const def = cardById[u.id.replace('#weak', '')];
      const el = boardEl(u, def, {enemy: sideKey === 'foe'});
      if (u.id.endsWith('#weak')) el.classList.add('weak');
      if (sideKey === 'me' && selectedAttackers.has(u.uid)) el.classList.add('picked');
      if (sideKey === 'me' && Object.values(blockPairs).includes(+slot.dataset.slot)) el.classList.add('blocking');
      if (sideKey === 'foe' && blockFocus !== null && view.combat?.attackers?.[blockFocus]?.uid === u.uid) el.classList.add('block-focus');
      if (isAttacking(u.uid)) el.classList.add('attacking');
      slot.append(el);
    });
  }
}
function isAttacking(uid) {
  return view.combat?.attackers?.some(a => a.uid === uid);
}
function mountHand() {
  const hand = $('#hand');
  if (!hand) return;
  hand.innerHTML = '';
  me().hand.forEach((raw, i) => {
    const weak = raw.endsWith('#weak');
    const def = cardById[raw.replace('#weak', '')];
    const el = cardEl(def, {weak, cls: weak ? 'weak' : ''});
    el.classList.add('hand-card');
    el.dataset.handIdx = i;
    el.style.setProperty('--i', i);
    el.style.setProperty('--n', me().hand.length);
    const cost = effectiveCost(def);
    const affordable = canAfford(def);
    el.classList.toggle('affordable', affordable && myTurn());
    el.classList.toggle('dim', !affordable);
    hand.append(el);
  });
}
function effectiveCost(def) { return def.cost; }
function canAfford(def) {
  const p = me();
  if (def.kind === 'spell') return p.oz + p.ani >= def.cost;
  return p.oz >= def.cost;
}

// ---------------- interactions ----------------
function bindInteractions() {
  // hand card click → play (or start targeting)
  $('#hand')?.addEventListener('click', e => {
    const c = e.target.closest('.hand-card');
    if (!c) return;
    playFromHand(+c.dataset.handIdx, c);
  });
  // drag hand card
  $('#hand')?.addEventListener('dragstart', e => {
    const c = e.target.closest('.hand-card');
    if (!c) return e.preventDefault();
    e.dataTransfer.setData('text/plain', c.dataset.handIdx);
    e.dataTransfer.effectAllowed = 'move';
  });
  // board drop targets (my row)
  $('#my-row')?.addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
  $('#my-row')?.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
  $('#my-row')?.addEventListener('drop', e => {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
    const idx = e.dataTransfer.getData('text/plain');
    if (idx !== '') playFromHand(+idx);
  });
  // unit clicks: attacker select / blocker assign / spell target
  $('#bfield')?.addEventListener('click', async e => {
    const bunit = e.target.closest('.bunit');
    const av = e.target.closest('.avatar');
    if (targetMode) {
      e.stopPropagation();
      const tgt = resolveTargetClick(bunit, av);
      if (tgt) { const idx = targetMode.handIdx; cancelTarget(); await sendPlay(idx, tgt); }
      return;
    }
    if (!bunit) return;
    const slotEl = bunit.closest('.bslot');
    const side = slotEl?.dataset.side;
    const uid = +bunit.dataset.uid;
    if (view.phase === 'block' && view.token !== actor()) {
      // defense: click enemy attacker to select, then my unit to assign
      if (side === 'foe') { selectAttackerToBlock(uid); return; }
      if (side === 'me' && blockFocus !== null) { assignBlock(uid); return; }
      return;
    }
    if (myTurn() && side === 'me' && view.token === actor() && !me().flag?.attacked) {
      const u = me().board.find(x => x.uid === uid);
      if (u && !u.summoningSick && effAtkView(u) > 0) {
        selectedAttackers.has(uid) ? selectedAttackers.delete(uid) : selectedAttackers.add(uid);
        sfx('uiClick'); render();
      }
    }
  });
  $('#btn-attack')?.addEventListener('click', async () => {
    if (!selectedAttackers.size) return;
    const slots = [...selectedAttackers].map(uid => me().board.findIndex(u => u.uid === uid)).filter(i => i >= 0);
    selectedAttackers.clear();
    await send({type: 'attack', slots});
  });
  $('#btn-block')?.addEventListener('click', async () => {
    await send({type: 'block', pairs: blockPairs});
    blockPairs = {}; blockFocus = null;
  });
  $('#btn-pass')?.addEventListener('click', async () => { await send({type: 'pass'}); });
  $('#btn-decline')?.addEventListener('click', async () => { await send({type: 'pass'}); });
  $('#btn-ult')?.addEventListener('click', async () => { await send({type: 'ultimate'}); });
  $('#btn-quit')?.addEventListener('click', () => {
    if (confirm(t('quitConfirm'))) send({type: 'concede'}).finally(() => session.onLeave?.());
  });
  $('#btn-log')?.addEventListener('click', () => $('#battle-log')?.classList.toggle('open'));
  $('#btn-tomap')?.addEventListener('click', () => session.onLeave?.(view.winner));
  $('#btn-rematch')?.addEventListener('click', () => session.onRematch?.());
  // mulligan
  const mc = $('#mull-cards');
  if (mc) {
    me().hand.forEach((raw, i) => {
      const def = cardById[raw.replace('#weak', '')];
      const el = cardEl(def);
      el.classList.add('mull-card');
      if (mullSel.has(i)) el.classList.add('swap');
      el.addEventListener('click', () => {
        mullSel.has(i) ? mullSel.delete(i) : mullSel.add(i);
        el.classList.toggle('swap');
        sfx('uiClick');
      });
      mc.append(el);
    });
    $('#btn-mulligan')?.addEventListener('click', async () => {
      const indices = [...mullSel];
      mullSel.clear();
      await send({type: 'mulligan', indices});
      sfx('shuffle');
    });
  }
  // targeting cursor arrow
  $('#bfield')?.addEventListener('mousemove', e => {
    if (targetMode?.srcEl) {
      FX.clearArrows();
      FX.arrowToPoint(targetMode.srcEl, e.clientX, e.clientY, '#e5c285');
    }
  });
  // LoR-style inspect: hover a board unit → big card with live stats
  $('#bfield')?.addEventListener('mouseover', e => {
    const bu = e.target.closest('.bunit');
    clearTimeout(inspectTimer);
    if (!bu) { hideInspect(); return; }
    inspectTimer = setTimeout(() => showInspect(bu), 320);
  });
  $('#bfield')?.addEventListener('mouseout', e => {
    const from = e.target.closest('.bunit');
    if (from && !(e.relatedTarget && from.contains(e.relatedTarget))) {
      clearTimeout(inspectTimer); hideInspect();
    }
  });
  document.addEventListener('keydown', escCancel);
}

// ---------------- inspect ----------------
let inspectEl = null, inspectTimer = 0;
function showInspect(bunit) {
  const uid = +bunit.dataset.uid;
  const side = bunit.closest('.bslot')?.dataset.side;
  const p = side === 'me' ? me() : foe();
  const u = p.board.find(x => x.uid === uid);
  if (!u) return;
  const def = cardById[u.id.replace('#weak', '')];
  if (!def) return;
  const atk = +(bunit.querySelector('.card-atk b')?.textContent ?? def.atk);
  const hp = +(bunit.querySelector('.card-hp b')?.textContent ?? def.hp);
  hideInspect();
  inspectEl = cardEl(def, {atk, hp, weak: u.id.endsWith('#weak'), cls: 'inspect-card'});
  inspectEl.dataset.side = side;
  document.body.append(inspectEl);
}
function hideInspect() { inspectEl?.remove(); inspectEl = null; }

// ---------------- tutorial ----------------
let tut = null;   // {i, steps[]}
const tutDone = () => localStorage.getItem('eruldin.tut') === '1';
function initTutorial() {
  tut = null;
  if (tutDone() || session.kind !== 'story' || session.chapter !== 0) return;
  tut = {i: -1, steps: [
    {when: () => view.phase === 'mulligan' && !me().mulliganDone,
     spot: () => $('#mull-cards'), text: () => t('tutMull')},
    {when: () => myTurn() && me().board.length === 0 && me().hand.some(raw => { const d = cardById[raw.replace('#weak','')]; return d && d.kind !== 'spell' && canAfford(d); }),
     spot: () => $('#hand'), text: () => t('tutPlay')},
    {when: () => myTurn() && view.token === actor() && !me().flag?.attacked && me().board.some(u => !u.summoningSick),
     spot: () => $('#my-row .bunit') || $('#btn-attack'), text: () => t('tutAttack')},
    {when: () => view.phase === 'block' && view.token !== actor(),
     spot: () => $('#foe-row .bunit.attacking') || $('#foe-row .bunit'), text: () => t('tutBlock')},
    {when: () => myTurn() && me().board.length > 0,
     spot: () => $('#btn-pass'), text: () => t('tutPass')},
  ]};
}
function tutorTick() {
  if (!tut) return;
  const cur = tut.steps[tut.i];
  // advance past finished / find first applicable step
  for (let i = 0; i < tut.steps.length; i++) {
    const st = tut.steps[i];
    if (st.when()) {
      if (i === tut.i) return;   // already showing
      tut.i = i;
      const el = st.spot();
      FX.tutorStep(el || $('#bfield'), st.text(), t('tutSkip'), () => finishTutorial());
      return;
    }
  }
  // nothing applicable right now
  if (cur && !cur.when()) FX.hideTutor();
  // all steps impossible later? done when board used and past mulligan + attack happened
  if (view.phase !== 'mulligan' && (me().flag?.attacked || view.round > 3 || view.winner != null)) finishTutorial();
}
function finishTutorial() {
  FX.hideTutor();
  localStorage.setItem('eruldin.tut', '1');
  tut = null;
}
function escCancel(e) {
  if (e.key === 'Escape' && targetMode) { cancelTarget(); render(); }
}

function effAtkView(u) { return Math.max(0, u.atk + (u.buffAtk || 0) + (u.tempAtk || 0)); }

function selectAttackerToBlock(uid) {
  const attackers = view.combat?.attackers || [];
  const idx = attackers.findIndex(a => a.uid === uid);
  if (idx < 0) return;
  blockFocus = blockFocus === idx ? null : idx;
  render();
}
function assignBlock(uid) {
  const mySlot = me().board.findIndex(u => u.uid === uid);
  if (mySlot < 0 || blockFocus === null) return;
  // remove my unit from another pair
  for (const k of Object.keys(blockPairs)) if (blockPairs[k] === mySlot) delete blockPairs[k];
  blockPairs[blockFocus] = mySlot;
  blockFocus = null;
  sfx('blockLock');
  render();
}

async function playFromHand(idx, el) {
  if (!myTurn() && !(view.stack.length && stackResponder() === actor())) return;
  const raw = me().hand[idx];
  const def = cardById[raw.replace('#weak', '')];
  if (!def) return;
  if (!canAfford(def)) { sfx('uiError'); return; }
  if (def.needsTarget) {
    targetMode = {handIdx: idx, def, srcEl: el};
    render();
    sfx('uiSelect');
    return;
  }
  await sendPlay(idx, null, el);
}
function resolveTargetClick(bunit, av) {
  const want = targetMode.def.needsTarget;
  const A = actor();
  if (av) {
    const isFoe = av.dataset.avatar === 'foe';
    if (want === 'enemy-avatar' || want === 'enemy-any') return isFoe ? {a: 1 - A, kind: 'avatar'} : null;
    return null;
  }
  if (!bunit) return null;
  const slotEl = bunit.closest('.bslot');
  const side = slotEl.dataset.side;
  const slot = +slotEl.dataset.slot;
  if (want === 'enemy-unit' || want === 'enemy-any') return side === 'foe' ? {a: 1 - A, slot} : null;
  if (want === 'ally-unit') return side === 'me' ? {a: A, slot} : null;
  if (want === 'any-unit') return {a: side === 'foe' ? 1 - A : A, slot};
  return null;
}
function cancelTarget() { targetMode = null; FX.clearArrows(); }

async function sendPlay(idx, target, el) {
  await send({type: 'play', hand: idx, target});
}
async function send(cmd) {
  if (busy) return;
  busy = true;
  try {
    const out = await session.backend.command(cmd);
    updateBattle(out.state ?? out);
    if (out.profile) session.onProfile?.(out.profile);
  } catch (e) {
    toast(e.message || t('err'));
    sfx('uiError');
  } finally { busy = false; }
}

// server mode wrap: backend.command returns {state,profile}; normalize handled in app
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('visible'), 3000);
}

// ---------------- event animation ----------------
// lastEvents is a rolling tail; diff against the previous tail by multiset.
function animateNew() {
  const cur = view.lastEvents || [];
  const prevBag = new Map();
  for (const e of seenEvents) { const k = JSON.stringify(e); prevBag.set(k, (prevBag.get(k) || 0) + 1); }
  const fresh = [];
  for (const e of cur) {
    const k = JSON.stringify(e);
    if ((prevBag.get(k) || 0) > 0) prevBag.set(k, prevBag.get(k) - 1);
    else fresh.push(e);
  }
  seenEvents = cur;
  let delay = 0;
  for (const ev of fresh.slice(-10)) {
    setTimeout(() => playEvent(ev), delay);
    delay += eventDur(ev);
  }
}
function eventDur(ev) {
  return {strike: 380, clash: 420, face: 420, death: 480, ultimate: 900, play: 350, resolve: 350, draw: 200}[ev.t] ?? 180;
}
function unitEl(a, slot) {
  return document.querySelector(`.bslot[data-side="${a === actor() ? 'me' : 'foe'}"][data-slot="${slot}"] .bunit`);
}
function uidEl(a, uid) {
  const p = a === actor() ? me() : foe();
  const i = p.board.findIndex(u => u.uid === uid);
  return i >= 0 ? unitEl(a, i) : null;
}
function avatarEl(a) { return document.querySelector(`.avatar[data-avatar="${a === actor() ? 'me' : 'foe'}"]`); }
const mine = a => a === actor();

function playEvent(ev) {
  switch (ev.t) {
    case 'draw': {
      sfx('cardDraw');
      if (mine(ev.a)) {
        const deck = $('.deck-count');
        const last = $('#hand')?.querySelectorAll('.hand-card');
        if (deck && last?.length) FX.fly(deck, last[last.length - 1], 'draw');
      }
      break;
    }
    case 'mulligan': sfx('shuffle'); break;
    case 'round': {
      sfx('turn');
      FX.banner(`${t('roundBanner')} ${ev.n}`, ev.token === actor() ? t('yourToken') : t('foeToken'));
      break;
    }
    case 'play': {
      sfx(ev.card?.includes?.('#weak') ? 'echoCharge' : 'cardPlay');
      const p = ev.a === actor() ? me() : foe();
      const u = p.board[p.board.length - 1];
      // find newest board el (best effort)
      const row = ev.a === actor() ? $('#my-row') : $('#foe-row');
      const last = row?.querySelectorAll('.bunit');
      if (last?.length) {
        FX.summonGlow(last[last.length - 1], 'gold');
        const hand = $('#hand');
        if (mine(ev.a) && hand) FX.fly(hand, last[last.length - 1], 'play');
      }
      break;
    }
    case 'ultimate': {
      sfx('ultimate'); FX.flash('rgba(240,225,180,.5)', 400);
      FX.burst(avatarEl(ev.a), 'white', 26); FX.shake($('#bfield'), 1.4);
      break;
    }
    case 'strike': case 'strike-back': {
      sfx('slash');
      FX.lunge(uidEl(ev.a, ev.uid), unitEl(1 - ev.a, ev.to));
      FX.popup(unitEl(1 - ev.a, ev.to), '-' + ev.n, 'dmg');
      break;
    }
    case 'clash': {
      sfx('slash'); sfx('hitLight');
      FX.popup(unitEl(ev.D === actor() ? ev.D : ev.D, ev.bi), '-' + ev.aDmg, 'dmg');
      FX.popup(unitEl(ev.A, ev.ai), '-' + ev.bDmg, 'dmg');
      FX.shake($('#bfield'), 0.8);
      break;
    }
    case 'face': {
      sfx('hitHeavy');
      FX.popup(avatarEl(1 - ev.a), '-' + ev.n, 'dmg');
      FX.shake($('#bfield'), 1);
      FX.flash('rgba(200,60,40,.18)');
      break;
    }
    case 'unit-dmg': {
      sfx('hitLight'); FX.popup(unitEl(ev.a, ev.slot), '-' + ev.n, 'dmg'); break;
    }
    case 'unit-heal': sfx('heal'); FX.popup(unitEl(ev.a, ev.slot), '+' + ev.n, 'heal'); break;
    case 'avatar-dmg': {
      sfx('hitHeavy'); FX.popup(avatarEl(ev.a), '-' + ev.n, 'dmg'); FX.shake($('#bfield'), 0.7); break;
    }
    case 'avatar-heal': sfx('heal'); FX.popup(avatarEl(ev.a), '+' + ev.n, 'heal'); break;
    case 'death': {
      sfx('death'); const el = uidEl(ev.a, ev.uid); if (el) FX.dieAnim(el); break;
    }
    case 'resolve': sfx('magic'); break;
    case 'hatira': sfx('memory'); FX.popup(avatarEl(ev.a), '◆', 'mem'); break;
    case 'corrupt': case 'corruption': sfx('void'); break;
    case 'return': case 'return-strongest': sfx('teleport'); break;
    case 'summon': sfx('summon'); break;
    case 'revive': sfx('summon'); break;
    case 'fatigue': case 'burn': sfx('uiError'); break;
    case 'calm': FX.popup(avatarEl(ev.a), '🛡', 'block'); break;
    case 'concede': break;
    case 'attack': sfx('attack'); break;
    case 'block': sfx('block'); break;
  }
}

function renderLog() {
  const el = $('#battle-log');
  if (!el) return;
  const evs = (view.lastEvents || []).slice(-14);
  el.innerHTML = evs.map(ev => `<div class="log-line">${describe(ev)}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}
function describe(ev) {
  const who = ev.a === actor() ? t('you') : foeName();
  switch (ev.t) {
    case 'round': return `${t('round')} ${ev.n}`;
    case 'play': return `${who}: ${ev.card ?? ''}`;
    case 'attack': return `${who} ${t('attack').toLowerCase()}`;
    case 'block': return `${who} ${t('block').toLowerCase()}`;
    case 'face': return `${who} → ${ev.n} ${t('hp')}`;
    case 'strike': case 'clash': return `⚔ ${ev.n ?? ev.aDmg ?? ''}`;
    case 'death': return `✝ ${ev.card}`;
    case 'ultimate': return `${who} — ${t('ultimate')}`;
    case 'draw': return `${who} +1`;
    case 'mulligan': return `${who} ↔ ${ev.n}`;
    case 'resolve': return `✦ ${ev.card}`;
    case 'fatigue': return `${who} — ${t('fatigue')}`;
    case 'hatira': return `${who} ◆+${ev.n}`;
    case 'concede': return `${who} — ${t('concede')}`;
    default: return ev.t;
  }
}

export function destroyBattle() {
  document.removeEventListener('keydown', escCancel);
  FX.clearArrows();
  FX.hideTutor();
  hideInspect();
}
