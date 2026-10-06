// Card element builder — v4 frames over card art, anchored cost/stats.
import {t, tn, lang} from './i18n.js';

const ART = './assets/art/';
// safe art rectangles + text anchors, normalized (from design-pack frame-layout-v4)
export const LAYOUT = {
  'unit-frame':     {frame: 'unit',     art: [0.152, 0.117, 0.856, 0.583], cost: [0.122, 0.077], name: [0.5, 0.655], text: [0.5, 0.742], atk: [0.145, 0.911], hp: [0.855, 0.911]},
  'champion-frame': {frame: 'champion', art: [0.112, 0.115, 0.902, 0.599], cost: [0.074, 0.077], name: [0.5, 0.655], text: [0.5, 0.742], atk: [0.10, 0.911], hp: [0.90, 0.911]},
  'spell-frame':    {frame: 'spell',    art: [0.110, 0.121, 0.880, 0.602], cost: [0.074, 0.077], name: [0.5, 0.655], text: [0.5, 0.742], atk: [0.10, 0.911], hp: [0.90, 0.911]},
  'board-unit':     {frame: 'board-unit',     art: [0.209, 0.160, 0.864, 0.735], atk: [0.201, 0.855], hp: [0.867, 0.855]},
  'board-champion': {frame: 'board-champion', art: [0.157, 0.161, 0.854, 0.732], atk: [0.15, 0.855], hp: [0.867, 0.855]},
};
// The action-v2 portraits were generated for these ids; fall back to card art otherwise.
const ACTION_ART = new Set(['marcel', 'akhenten', 'onbion', 'teom-echo', 'white-echo', 'karah-heavy']);
const artUrl = c => `${ART}${(c.art || 'karah.png').replace(/\.(png|jpg|webp)$/i, '.jpg')}`;

export function frameKind(def) {
  if (def.kind === 'spell') return 'spell-frame';
  if (def.kind === 'hero') return 'champion-frame';
  return 'unit-frame';
}

const kwBadges = (kw = []) => kw.map(k => `<i class="kw kw-${k}" data-kw="${k}"></i>`).join('');

// Full card (hand/collection/tooltip)
export function cardEl(def, {cls = '', atk, hp, weak = false} = {}) {
  const L = LAYOUT[frameKind(def)];
  const el = document.createElement('div');
  el.className = `card ${frameKind(def)} ${cls} grp-${def.group}`;
  el.dataset.cardId = def.id;
  const speed = def.kind === 'spell' ? `<span class="spd spd-${def.speed || 'yavas'}">${t('spd_' + (def.speed || 'yavas'))}</span>` : '';
  el.innerHTML = `
    <div class="card-art" style="inset:${L.art[1] * 100}% ${(1 - L.art[2]) * 100}% ${(1 - L.art[3]) * 100}% ${L.art[0] * 100}%"><img src="${artUrl(def)}" alt="" draggable="false" loading="lazy"></div>
    <img class="card-frame" src="${ART}frames/${L.frame}.png" alt="" draggable="false">
    <div class="card-cost" style="left:${L.cost[0] * 100}%;top:${L.cost[1] * 100}%"><b>${def.cost}</b></div>
    <div class="card-name" style="left:${L.name[0] * 100}%;top:${L.name[1] * 100}%"><span>${tn(def.name)}</span></div>
    ${speed}
    <div class="card-text" style="left:${L.text[0] * 100}%;top:${L.text[1] * 100}%"><p>${tn(def.text)}${weak ? ' ' : ''}</p>${def.kw?.length ? `<div class="kw-row">${kwBadges(def.kw)}</div>` : ''}</div>
    ${def.kind !== 'spell' ? `
      <div class="card-atk" style="left:${L.atk[0] * 100}%;top:${L.atk[1] * 100}%"><b>${atk ?? def.atk}</b></div>
      <div class="card-hp" style="left:${L.hp[0] * 100}%;top:${L.hp[1] * 100}%"><b>${hp ?? def.hp}</b></div>` : ''}
    ${weak ? '<div class="card-weak">' + t('weak') + '</div>' : ''}`;
  return el;
}

// Compact board minion
export function boardEl(u, def, {enemy = false} = {}) {
  const kind = def.kind === 'hero' ? 'board-champion' : 'board-unit';
  const L = LAYOUT[kind];
  const el = document.createElement('div');
  el.className = `bunit ${enemy ? 'enemy' : 'ally'} grp-${def.group}${u.summoningSick ? ' sick' : ''}${u.corrupted ? ' corrupted' : ''}`;
  el.dataset.uid = u.uid;
  el.innerHTML = `
    <div class="card-art" style="inset:${L.art[1] * 100}% ${(1 - L.art[2]) * 100}% ${(1 - L.art[3]) * 100}% ${L.art[0] * 100}%"><img src="${artUrl(def)}" alt="" draggable="false" loading="lazy"></div>
    <img class="card-frame" src="${ART}frames/${L.frame}.png" alt="" draggable="false">
    <div class="bunit-kw">${kwBadges(u.kw)}</div>
    <div class="card-atk" style="left:${L.atk[0] * 100}%;top:${L.atk[1] * 100}%"><b>${Math.max(0, u.atk + (u.buffAtk || 0) + (u.tempAtk || 0))}</b></div>
    <div class="card-hp" style="left:${L.hp[0] * 100}%;top:${L.hp[1] * 100}%"><b>${u.hp}</b></div>
    ${u.summoningSick ? '<div class="sick"></div>' : ''}`;
  return el;
}

// Keyword tooltip popover — bind once on document
let tip = null;
export function bindTooltip(cardDefs) {
  document.addEventListener('mouseover', e => {
    const kw = e.target.closest?.('.kw');
    if (kw) {
      const k = kw.dataset.kw;
      showTip(kw, `<b>${t('kw_' + k)}</b><p>${t('kw_h_' + k)}</p>`);
      return;
    }
    const card = e.target.closest?.('.card,.bunit,.stack-card');
    if (card && card.dataset.cardId && cardDefs[card.dataset.cardId]) {
      const def = cardDefs[card.dataset.cardId];
      showTip(card, `<b>${tn(def.name)}</b><small>${t(def.kind)}${def.kw?.length ? ' · ' + def.kw.map(k => t('kw_' + k)).join(', ') : ''}</small><p>${tn(def.text) || ''}</p>${def.flavor ? `<em>${tn(def.flavor)}</em>` : ''}`);
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest?.('.kw,.card,.bunit,.stack-card')) hideTip();
  });
}
function showTip(anchor, html) {
  if (!tip) { tip = document.createElement('div'); tip.className = 'kw-tip'; document.body.append(tip); }
  tip.innerHTML = html;
  tip.style.display = 'block';
  const r = anchor.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2;
  x = Math.max(8, Math.min(innerWidth - tw - 8, x));
  let y = r.top - th - 10;
  if (y < 8) y = r.bottom + 10;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { if (tip) tip.style.display = 'none'; }
