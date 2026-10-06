// ERULDIN: YANKILAR — TFT-style grid auto-battle engine.
// Pure + deterministic: same input, same result, no I/O.
//
// Grid is 7x4 (x:0..6, y:0..3). Player deploys on rows y=2,3; the boss
// formation occupies y=0,1. Combat runs in ticks: each unit picks the
// nearest living enemy (Manhattan), steps one cell toward it, or strikes
// when adjacent. Strike order resolves fastest-first: cabuk initiative 2,
// everyone else 1 (higher acts first; ties break by uid). Keyword effects
// kept from the card game: dayanikli (-1 dmg taken), cabuk (first strike),
// ezici (overflow hits the enemy line — +1 dmg to the unit behind the kill),
// celik (+2 vs karah), canavar (self-heals for damage dealt), koruyucu
// (draws attackers within its row), yanki (returns once at half stats).
// Group synergy: fielding 3+ units of one GROUP grants all of them +1/+1.
//
// Win = last side standing; 200-tick cap → defender (boss side) wins.

import {cardById} from '../content/cards.mjs';

export const GRID = {w: 7, h: 4, deployRows: [2, 3]};
export const SQUAD_CAP = 6;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const adjacent = (a, b) => dist(a, b) === 1;

function mkUnit(cardId, x, y, side, uid, kwAll = []) {
  const c = cardById[cardId];
  if (!c || (c.kind !== 'unit' && c.kind !== 'hero')) throw Error(`TFT: ${cardId} birim değil`);
  const kw = [...new Set([...(c.kw || []), ...kwAll])];
  return {uid, id: cardId, side, x, y,
    atk: c.atk, hp: c.hp, max: c.hp, kw, group: c.group,
    revives: kw.includes('yanki') ? 1 : 0,
    name: c.name};
}

function applySynergy(units) {
  const byGroup = {};
  for (const u of units) if (u.group) byGroup[u.group] = (byGroup[u.group] || 0) + 1;
  for (const u of units) if (u.group && byGroup[u.group] >= 3) { u.atk += 1; u.hp += 1; u.max += 1; u.buffed = true; }
}

function neighbors(u, taken) {
  const c = [{x: u.x, y: u.y - 1}, {x: u.x, y: u.y + 1}, {x: u.x - 1, y: u.y}, {x: u.x + 1, y: u.y}];
  return c.filter(p => p.x >= 0 && p.x < GRID.w && p.y >= 0 && p.y < GRID.h && !taken.has(p.x + ',' + p.y));
}

// simulate({player:[{cardId,x,y}], enemy:[{cardId,x,y}], seed, enemyKwAll})
//   -> {winner: 0|1|2(draw), ticks, log:[{t,ev,uid,...}], units:[final states]}
export function simulate({player, enemy, seed = 1, enemyKwAll = []}) {
  if (!player?.length || !enemy?.length) throw Error('TFT: iki taraf da birim ister');
  const log = [];
  let uid = 0;
  const units = [
    ...player.map(p => mkUnit(p.cardId, p.x, p.y, 0, uid++)),
    ...enemy.map(p => mkUnit(p.cardId, p.x, p.y, 1, uid++, enemyKwAll)),
  ];
  applySynergy(units.filter(u => u.side === 0));
  applySynergy(units.filter(u => u.side === 1));

  const taken = () => new Set(units.filter(u => u.hp > 0).map(u => u.x + ',' + u.y));

  const targetOf = (u, foes) => {
    // koruyucu on the foe's front row taunts attackers in its row band
    const guards = foes.filter(f => f.kw.includes('koruyucu') && Math.abs(f.y - u.y) <= 1);
    const pool = guards.length ? guards : foes;
    return pool.reduce((best, f) => dist(u, f) < dist(u, best) ? f : best);
  };

  const MAXT = 200;
  for (let t = 1; t <= MAXT; t++) {
    const alive = units.filter(u => u.hp > 0);
    if (!alive.some(u => u.side === 0)) return {winner: 1, ticks: t, log, units};
    if (!alive.some(u => u.side === 1)) return {winner: 0, ticks: t, log, units};
    // act order: cabuk first, then by uid
    const order = [...alive].sort((a, b) =>
      (b.kw.includes('cabuk') ? 1 : 0) - (a.kw.includes('cabuk') ? 1 : 0) || a.uid - b.uid);
    const occ = taken();
    for (const u of order) {
      if (u.hp <= 0) continue;
      const foes = units.filter(f => f.hp > 0 && f.side !== u.side);
      if (!foes.length) break;
      const tgt = targetOf(u, foes);
      if (!adjacent(u, tgt)) {
        // step toward target (prefer axis with bigger gap, smallest axis tie → y toward center)
        const opts = neighbors(u, occ);
        if (opts.length) {
          opts.sort((a, b) => dist(a, tgt) - dist(b, tgt));
          const n = opts[0];
          occ.delete(u.x + ',' + u.y); u.x = n.x; u.y = n.y; occ.add(u.x + ',' + u.y);
          log.push({t, ev: 'move', uid: u.uid, x: u.x, y: u.y});
        }
        continue;
      }
      let dmg = u.atk;
      if (u.kw.includes('celik') && tgt.group === 'karah') dmg += 2;
      if (tgt.kw.includes('dayanikli')) dmg = Math.max(0, dmg - 1);
      tgt.hp -= dmg;
      if (u.kw.includes('canavar')) u.hp = Math.min(u.max, u.hp + dmg);
      log.push({t, ev: 'hit', uid: u.uid, tgt: tgt.uid, dmg, hp: tgt.hp});
      if (tgt.hp <= 0) {
        log.push({t, ev: 'die', uid: tgt.uid});
        if (tgt.revives > 0) {
          tgt.revives--; tgt.hp = Math.max(1, Math.floor(tgt.max / 2)); tgt.atk = Math.max(1, Math.floor(tgt.atk / 2));
          occ.add(tgt.x + ',' + tgt.y);
          log.push({t, ev: 'revive', uid: tgt.uid, hp: tgt.hp});
        } else if (u.kw.includes('ezici')) {
          // overflow: nearest foe behind the kill
          const rest = units.filter(f => f.hp > 0 && f.side === tgt.side);
          if (rest.length) {
            const behind = rest.reduce((b, f) => dist(tgt, f) < dist(tgt, b) ? f : b);
            let od = Math.max(0, dmg - 0 - Math.max(0, tgt.max - tgt.hp));   // spill = damage beyond killing
            if (od > 0) { behind.hp -= od; log.push({t, ev: 'spill', uid: u.uid, tgt: behind.uid, dmg: od}); }
          }
        }
      }
    }
  }
  const pAlive = units.some(u => u.hp > 0 && u.side === 0);
  const eAlive = units.some(u => u.hp > 0 && u.side === 1);
  return {winner: pAlive && eAlive ? 1 : pAlive ? 0 : 1, ticks: MAXT, log, units};
}

// Build a boss formation from a chapter's deck: strongest units placed on the
// two far rows, heaviest center-front. Deterministic by chapter seed.
export function bossFormation(deck, seed = 1) {
  const rng = mulberry32(seed);
  const units = [...new Set(deck)]
    .map(id => cardById[id]).filter(c => c && (c.kind === 'unit' || c.kind === 'hero'))
    .sort((a, b) => (b.cost + b.atk + b.hp) - (a.cost + a.atk + a.hp))
    .slice(0, 6);
  // formation: heroes/back-liners row 0 (back), rest row 1 (front), symmetric-ish
  const front = units.filter((_, i) => i % 2 === 0);
  const back = units.filter((_, i) => i % 2 === 1);
  const out = [];
  front.forEach((c, i) => out.push({cardId: c.id, x: 1 + Math.floor(i * (5 / Math.max(1, front.length - 1 || 1))), y: 1}));
  back.forEach((c, i) => out.push({cardId: c.id, x: 2 + i * 2, y: 0}));
  return out;
}
