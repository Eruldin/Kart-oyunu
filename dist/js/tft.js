// TFT-style boss battle screen: deploy owned units on the grid, then watch
// the deterministic auto-battle replay tick by tick.
import {t, tn, lang} from './i18n.js';
import * as audio from './audio.js';
import * as FX from './fx.js';
import {cardById, GROUPS} from '../vendor/content/cards.mjs';
import {simulate, bossFormation, GRID, SQUAD_CAP} from '../vendor/engine/tft.mjs';

const ART = './assets/art/';
const artUrl = c => `${ART}${(c?.art || 'gen/direnis-1.png').replace(/\.\w+$/, '.jpg')}`;

let ctx = null;
// ctx = {ch, chapterIdx, enemy:[], placed:Map(cellKey->cardId), benchSel, phase, replay}

export function startTft(sess, onDone) {
  const ch = sess.chapterData;
  ctx = {
    sess, onDone, ch,
    enemy: bossFormation(ch.deck, ch.seed),
    placed: new Map(), sel: null, phase: 'deploy',
  };
  render();
}

function units() {
  // player's owned units, best first
  const col = ctx.sess.profile?.collection || {};
  return Object.keys(col).filter(id => {
    const c = cardById[id];
    return c && (c.kind === 'unit' || c.kind === 'hero') && col[id] > 0;
  }).sort((a, b) => (cardById[b].cost + cardById[b].atk + cardById[b].hp) - (cardById[a].cost + cardById[a].atk + cardById[a].hp));
}

function render() {
  const app = document.querySelector('#app');
  app.innerHTML = `
  <div class="tft-screen">
    <img class="map-bg" src="${ART}screens/campaign-map.png" alt="" data-depth="0.02">
    <div class="map-veil"></div>
    ${FX.ambientHTML()}
    <header class="map-head">
      <button class="icon-btn" id="tft-back">←</button>
      <div><h1>${tn(ctx.ch.name)}</h1><p>${t('tftHint')}</p></div>
      <button class="btn war big" id="tft-fight" ${ctx.placed.size ? '' : 'disabled'}>${t('tftFight')}</button>
    </header>
    <div class="tft-board" id="tft-board">
      ${Array.from({length: GRID.h}, (_, y) => Array.from({length: GRID.w}, (_, x) => {
        const key = `${x},${y}`;
        const foe = ctx.enemy.find(e => e.x === x && e.y === y);
        const mine = ctx.placed.get(key);
        const canPlace = GRID.deployRows.includes(y) && ctx.phase === 'deploy';
        let inner = '';
        if (foe) inner = cellHTML(cardById[foe.cardId], 'foe', foe);
        else if (mine) inner = cellHTML(cardById[mine], 'me', {cardId: mine, key});
        return `<div class="tcell ${canPlace ? 'deploy' : ''} ${mine ? 'filled' : ''} ${foe ? 'foe' : ''}" data-cell="${key}">${inner}</div>`;
      }).join('')).join('')}
    </div>
    ${ctx.phase === 'deploy' ? `
    <div class="tft-bench" id="tft-bench">
      <div class="bench-h">${t('tftBench')} · ${ctx.placed.size}/${SQUAD_CAP}</div>
      <div class="bench-row">
        ${units().slice(0, 24).map(id => {
          const c = cardById[id];
          const used = [...ctx.placed.values()].includes(id);
          return `<button class="bench-card ${used ? 'used' : ''}" data-unit="${id}" ${used ? 'disabled' : ''}>
            <img src="${artUrl(c)}" alt="" loading="lazy"><b>${tn(c.name)}</b><i>${c.atk}/${c.hp}</i>
          </button>`;
        }).join('')}
      </div>
    </div>` : `<div class="tft-bench"><div class="bench-h" id="tft-status">${t('tftRunning')}</div></div>`}
  </div>`;
  FX.parallax(app.querySelector('.tft-screen'));
  if (ctx.phase === 'deploy') bindDeploy();
  else runReplay();
}

function cellHTML(c, side, ref) {
  return `<div class="tunit ${side} ${ref?.uid !== undefined ? 'live' : ''}" data-uid="${ref?.uid ?? ''}" data-cell-ref="${ref?.key ?? ''}">
    <img src="${artUrl(c)}" alt="" loading="lazy">
    <span class="tstat"><b class="ta">${c.atk}</b><b class="th">${c.hp}</b></span>
    <span class="tbar"><i style="width:100%"></i></span>
  </div>`;
}

function bindDeploy() {
  document.querySelector('#tft-back').addEventListener('click', () => ctx.onDone?.(null));
  document.querySelector('#tft-fight').addEventListener('click', () => {
    if (!ctx.placed.size) return;
    audio.sfx('uiConfirm');
    ctx.phase = 'combat';
    ctx.result = simulate({
      player: [...ctx.placed.entries()].map(([k, id]) => { const [x, y] = k.split(',').map(Number); return {cardId: id, x, y}; }),
      enemy: ctx.enemy,
      seed: (ctx.ch.seed || 1) ^ (ctx.sess.profile?.storyWins || 0),
    });
    render();
  });
  document.querySelectorAll('.bench-card').forEach(b => b.addEventListener('click', () => {
    ctx.sel = b.dataset.unit;
    document.querySelectorAll('.bench-card').forEach(x => x.classList.toggle('sel', x === b));
    audio.sfx('uiClick');
  }));
  document.querySelectorAll('.tcell').forEach(cell => cell.addEventListener('click', () => {
    const key = cell.dataset.cell;
    const [x, y] = key.split(',').map(Number);
    if (!GRID.deployRows.includes(y)) return;
    if (ctx.placed.has(key)) { ctx.placed.delete(key); audio.sfx('uiClick'); render(); return; }
    if (!ctx.sel || ctx.placed.size >= SQUAD_CAP) { audio.sfx('uiError'); return; }
    ctx.placed.set(key, ctx.sel);
    audio.sfx('cardPlace');
    render();
  }));
}

// -------- replay --------
function runReplay() {
  const board = document.querySelector('#tft-board');
  const {result} = ctx;
  // place unit divs free-positioned over the grid
  const cellW = board.clientWidth / GRID.w, cellH = board.clientHeight / GRID.h;
  const uDivs = {};
  // initial positions: players from the placed map (order = placement order =
  // sim order), enemies from their formation slot (uid - playerCount).
  const pPos = [...ctx.placed.keys()].map(k => k.split(',').map(Number));
  const pCount = pPos.length;
  let pIdx = 0;
  for (const u of result.units) {
    const el = document.createElement('div');
    el.className = `tunit ${u.side ? 'foe' : 'me'} live anim`;
    el.dataset.uid = u.uid;
    const c = cardById[u.id];
    const pos = u.side ? [ctx.enemy[u.uid - pCount].x, ctx.enemy[u.uid - pCount].y] : pPos[pIdx++];
    u.rx = pos[0]; u.ry = pos[1];
    el.innerHTML = `<img src="${artUrl(c)}"><span class="tstat"><b class="ta">${u.atk}</b><b class="th">${u.hp}</b></span><span class="tbar"><i style="width:100%"></i></span>`;
    el.style.left = (pos[0] * cellW) + 'px';
    el.style.top = (pos[1] * cellH) + 'px';
    el.style.width = cellW * 0.88 + 'px';
    el.style.height = cellH * 0.88 + 'px';
    board.appendChild(el);
    uDivs[u.uid] = el;
  }
  const U = Object.fromEntries(result.units.map(u => [u.uid, u]));
  const byTick = {};
  for (const ev of result.log) (byTick[ev.t] ||= []).push(ev);
  const ticks = Object.keys(byTick).map(Number).sort((a, b) => a - b);
  let ti = 0;
  const step = () => {
    const t = ticks[ti++];
    if (t === undefined) return finish();
    for (const ev of byTick[t]) {
      const el = uDivs[ev.uid];
      if (!el) continue;
      if (ev.ev === 'move') {
        el.style.left = (ev.x * cellW) + 'px';
        el.style.top = (ev.y * cellH) + 'px';
      } else if (ev.ev === 'hit') {
        el.classList.add('lunge');
        setTimeout(() => el.classList.remove('lunge'), 260);
        const tgt = uDivs[ev.tgt];
        if (tgt) {
          tgt.classList.add('shake');
          const bar = tgt.querySelector('.tbar i');
          const u = U[ev.tgt];
          const maxHp = u.max || 1;
          bar.style.width = Math.max(0, ev.hp / maxHp * 100) + '%';
          tgt.querySelector('.th').textContent = Math.max(0, ev.hp);
          setTimeout(() => tgt.classList.remove('shake'), 300);
        }
        audio.sfx('hitLight');
      } else if (ev.ev === 'die') {
        el.classList.add('dying');
        audio.sfx('death');
      } else if (ev.ev === 'revive') {
        el.classList.remove('dying');
        el.querySelector('.tbar i').style.width = (ev.hp / (U[ev.uid].max || 1) * 100) + '%';
      } else if (ev.ev === 'spill') {
        const tgt = uDivs[ev.tgt];
        if (tgt) tgt.classList.add('shake');
      }
    }
    const aliveMe = result.units.filter(u => u.side === 0 && u.hp > 0).length;
    const aliveFo = result.units.filter(u => u.side === 1 && u.hp > 0).length;
    const st = document.querySelector('#tft-status');
    if (st) st.textContent = `${t('tftRunning')} · ${aliveMe} ⚔ ${aliveFo}`;
    setTimeout(step, 430);
  };
  const finish = () => {
    const win = result.winner === 0;
    const st = document.querySelector('#tft-status');
    if (st) st.textContent = t(win ? 'victory' : 'defeat');
    setTimeout(() => ctx.onDone?.(win ? 'win' : 'lose', result), 900);
  };
  setTimeout(step, 500);
}
