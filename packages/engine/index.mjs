// ERULDIN: YANKILAR — deterministic rules engine
// Command -> event model. Same seed + same command stream = same result.
// No wall-clock, no Math.random: all randomness flows through a seeded PRNG
// whose state lives inside the match state.

import {cardById, ECHOES} from '../content/cards.mjs';

const MAX_HAND = 10;
const BOARD_SLOTS = 6;
const OZ_CAP = 10;
const ANI_CAP = 3;
const HATIRA_CAP = 6;
const MULLIGAN_SIZE = 4;

// ---------- seeded PRNG (mulberry32), state carried in match ----------
function rngNext(state) {
  let s = state.rng | 0;
  s = (s + 0x6D2B79F5) | 0;
  state.rng = s;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rngInt(state, n) { return Math.floor(rngNext(state) * n); }
function shuffle(state, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rngInt(state, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const clone = o => JSON.parse(JSON.stringify(o));
const other = a => 1 - a;

function log(state, ev) { state.events.push(ev); state.log.push(ev); return ev; }

// ---------- match creation ----------
export function createMatch(opts) {
  const {
    seed = 1,
    echo = ['ash', 'ash'],
    health = [24, 24],
    decks,
    first = 0,
    mutators,                    // [{...mods for player0}, {...for player1}] — campaign buffs
  } = opts || {};
  if (!Array.isArray(decks) || decks.length !== 2) throw Error('İki deste gerekli.');
  for (const d of decks) for (const id of d) if (!cardById[id]) throw Error('Bilinmeyen kart: ' + id);

  const state = {
    v: 2,
    rng: (seed >>> 0) || 1,
    seed,
    round: 0,
    active: first,
    token: first,
    phase: 'action',            // action | declare | block | over
    players: [0, 1].map(i => ({
      avatar: {hp: health[i], max: health[i], echo: echo[i], hatira: 0, ultUsed: false, flagUsed: false},
      oz: 0, ani: 0, shield: 0,
      deck: [], hand: [], board: [],
      dead: [],      // units that died this match (for revive)
      echoPool: [],  // weakened echoes returning next round
      passed: false, flag: {},
      stats: {played: 0, spells: 0, attacks: 0, dmgDealt: 0, dmgTaken: 0},
      mods: mutators?.[i] || {},   // {kwAll:[], shield, hatira, hpBonus, ozStart}
    })),
    stack: [],                 // pending fast spell responses
    combat: null,
    winner: null,
    events: [], log: [],
  };

  for (let i = 0; i < 2; i++) state.players[i].deck = shuffle(state, decks[i].slice());

  // campaign mutators: per-side battle modifiers (boss buffs)
  for (let i = 0; i < 2; i++) {
    const p = state.players[i], m = p.mods;
    if (m.hpBonus) { p.avatar.max += m.hpBonus; p.avatar.hp += m.hpBonus; }
    if (m.shield) p.shield += m.shield;
    if (m.hatira) p.avatar.hatira = Math.min(HATIRA_CAP, m.hatira);
    if (m.ozStart) p.oz += m.ozStart;
  }

  // opening hands, then the mulligan window; round 1 starts once both players lock in
  for (let i = 0; i < 2; i++) {
    for (let k = 0; k < MULLIGAN_SIZE; k++) drawCard(state, i, true);
    state.players[i].mulliganDone = false;
  }
  state.phase = 'mulligan';
  log(state, {t: 'start', seed, echo: [...echo], health: [...health], first});
  return state;
}

// ---------- helpers ----------
function player(state, a) { return state.players[a]; }
function unit(uidOwner, card, slot) {
  return {
    uid: uidOwner,
    id: card.id, name: card.name, kind: card.kind === 'hero' ? 'hero' : 'unit',
    group: card.group, cost: card.cost,
    atk: card.atk, hp: card.hp, maxHp: card.hp,
    kw: [...(card.kw || [])],
    art: card.art,
    buffAtk: 0, buffHp: 0, tempAtk: 0,
    corrupted: 0, summoningSick: true, echoOf: null, flag: {},
  };
}
let uidSeq = 1;
function effAtk(u) { return Math.max(0, u.atk + u.buffAtk + u.tempAtk); }
function effHp(u) { return u.hp; }
function hasKw(u, k) { return u.kw.includes(k); }
function isAlive(u) { return u.hp > 0; }

function drawCard(state, a, silent = false) {
  const p = player(state, a);
  if (!p.deck.length) { log(state, {t: 'fatigue', a}); damageAvatar(state, a, 2, 'fatigue'); return; }
  const id = p.deck.shift();
  if (p.hand.length >= MAX_HAND) { log(state, {t: 'burn', a, card: id}); return; }
  p.hand.push(id);
  if (!silent) log(state, {t: 'draw', a});
}
// called whenever a unit enters a board — applies the owner's mutator keywords
function enterUnit(state, a, u) {
  const mods = player(state, a).mods;
  if (mods?.kwAll) for (const k of mods.kwAll) if (!u.kw.includes(k)) u.kw.push(k);
  return u;
}
function removeFromBoard(state, a, slot) {
  const p = player(state, a);
  const u = p.board[slot];
  p.board.splice(slot, 1);
  return u;
}
function killUnit(state, a, slot, why, ctx = {}) {
  const p = player(state, a);
  const u = removeFromBoard(state, a, slot);
  p.dead.push(u.id);
  log(state, {t: 'death', a, uid: u.uid, card: u.id, why});
  // Yankı mechanic: units with 'yanki' return next round as weakened echoes
  if (hasKw(u, 'yanki')) {
    p.echoPool.push({card: u.id, weak: true});
    log(state, {t: 'echo-pool', a, card: u.id});
  }
  // card-defined death triggers
  const def = cardById[u.id];
  if (def && def.sonNefes) runEffects(state, a, def.sonNefes, {self: null});
  // hatira: a friend's memory feeds the echo
  gainHatira(state, a, 1, 'loss');
  // Olüştür: the killer's on-kill trigger
  if (ctx.killer) {
    const kp = player(state, ctx.killerA);
    const ki = kp.board.findIndex(x => x.uid === ctx.killer.uid);
    if (ki >= 0) {
      const kd = cardById[kp.board[ki].id];
      if (kd?.olustur) runEffects(state, ctx.killerA, kd.olustur, {self: ref(kp.board[ki], ctx.killerA, ki), dead: u});
    }
  }
  return u;
}
function damageAvatar(state, a, n, why) {
  const p = player(state, a);
  if (n <= 0) return;
  // Miras: calm — first avatar damage each round reduced by 2
  const echo = ECHOES[p.avatar.echo];
  if (echo && echo.passive === 'calm' && !p.flag.calm) {
    p.flag.calm = true;
    const absorbed = Math.min(3, n);
    n -= absorbed;
    log(state, {t: 'calm', a, absorbed});
    if (n <= 0) return;
  }
  // Zırh (armor granted by effects) absorbs damage before it lands
  if (p.shield > 0) {
    const sh = Math.min(p.shield, n);
    p.shield -= sh; n -= sh;
    log(state, {t: 'shield-hit', a, absorbed: sh, left: p.shield});
    if (n <= 0) return;
  }
  p.avatar.hp -= n;
  p.stats.dmgTaken += n;
  log(state, {t: 'avatar-dmg', a, n, hp: p.avatar.hp, why});
  checkEnd(state);
}
function healAvatar(state, a, n) {
  const p = player(state, a);
  const before = p.avatar.hp;
  p.avatar.hp = Math.min(p.avatar.max, p.avatar.hp + n);
  if (p.avatar.hp !== before) log(state, {t: 'avatar-heal', a, n: p.avatar.hp - before, hp: p.avatar.hp});
}
function damageUnit(state, a, slot, n, why, pierce) {
  const p = player(state, a);
  const u = p.board[slot];
  if (!u) return;
  let dmg = n;
  if (hasKw(u, 'dayanikli') && !pierce) dmg = Math.max(0, dmg - 1);
  u.hp -= dmg;
  if (dmg > 0) { log(state, {t: 'unit-dmg', a, slot, n: dmg, hp: u.hp, why}); }
  if (u.hp <= 0) killUnit(state, a, slot, why);
}
function healUnit(state, a, slot, n) {
  const u = player(state, a).board[slot];
  if (!u) return;
  const before = u.hp;
  u.hp = Math.min(u.maxHp, u.hp + n);
  if (u.hp !== before) log(state, {t: 'unit-heal', a, slot, n: u.hp - before});
}
function checkEnd(state) {
  if (state.winner !== null) return;
  const h0 = state.players[0].avatar.hp, h1 = state.players[1].avatar.hp;
  if (h0 <= 0 && h1 <= 0) state.winner = 'draw';
  else if (h0 <= 0) state.winner = 1;
  else if (h1 <= 0) state.winner = 0;
  if (state.winner !== null) { state.phase = 'over'; log(state, {t: 'end', winner: state.winner}); }
}
function gainHatira(state, a, n, why) {
  const av = player(state, a).avatar;
  if (av.hatira >= HATIRA_CAP) return;
  av.hatira = Math.min(HATIRA_CAP, av.hatira + n);
  log(state, {t: 'hatira', a, n, total: av.hatira, why});
}

// ---------- effect DSL ----------
// {t:'damage'|'heal'|'buff'|'draw'|'summon'|'corrupt'|'cleanse'|'return'|'revive'|'hatira'|'silence'|'temp-atk'|'give-kw', target, n, ...}
function ref(u, a, slot) { return {kind: 'unit', a, slot, uid: u.uid}; }
function resolveTarget(state, a, spec, ctx) {
  // returns array of {kind:'avatar'|'unit', a, slot, uid}
  switch (spec) {
    case 'self-avatar': return [{kind: 'avatar', a}];
    case 'enemy-avatar': return [{kind: 'avatar', a: other(a)}];
    case 'all-enemy-units': return player(state, other(a)).board.map((u, s) => ref(u, other(a), s));
    case 'all-friendly-units': return player(state, a).board.map((u, s) => ref(u, a, s));
    case 'all-units': return [0, 1].flatMap(p => player(state, p).board.map((u, s) => ref(u, p, s)));
    case 'target-unit': {
      const t = ctx.target;
      const u = t && t.slot != null ? player(state, t.a)?.board[t.slot] : null;
      return u ? [ref(u, t.a, t.slot)] : [];
    }
    case 'target-avatar': return ctx.target?.kind === 'avatar' ? [ctx.target] : [];
    case 'random-enemy': {
      const b = player(state, other(a)).board;
      if (!b.length) return [];
      const s = rngInt(state, b.length);
      return [ref(b[s], other(a), s)];
    }
    case 'strongest-enemy': {
      const b = player(state, other(a)).board;
      if (!b.length) return [];
      let best = 0;
      for (let s = 1; s < b.length; s++) if (effAtk(b[s]) > effAtk(b[best])) best = s;
      return [ref(b[best], other(a), best)];
    }
    case 'weakest-enemy': {
      const b = player(state, other(a)).board;
      if (!b.length) return [];
      let best = 0;
      for (let s = 1; s < b.length; s++) if (effAtk(b[s]) < effAtk(b[best])) best = s;
      return [ref(b[best], other(a), best)];
    }
    case 'self': return ctx.self ? [ctx.self] : [];
    case 'adjacent': {
      // units next to ctx.self in the owner's row
      const t = ctx.self;
      if (!t || t.kind !== 'unit') return [];
      const b = player(state, t.a).board;
      const idx = b.findIndex(u => u.uid === t.uid);
      if (idx < 0) return [];
      const out = [];
      if (b[idx - 1]) out.push(ref(b[idx - 1], t.a, idx - 1));
      if (b[idx + 1]) out.push(ref(b[idx + 1], t.a, idx + 1));
      return out;
    }
    default: return [];
  }
}
// find a unit referenced earlier — the board may have shifted
function live(state, tg) {
  if (tg.kind !== 'unit') return null;
  const b = player(state, tg.a).board;
  const idx = b.findIndex(u => u.uid === tg.uid);
  if (idx === -1) return null;
  return {u: b[idx], slot: idx};
}
function runEffects(state, a, effects, ctx = {}) {
  if (state.winner !== null) return;
  for (const e of effects) {
    switch (e.t) {
      case 'damage': {
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          if (tg.kind === 'avatar') { damageAvatar(state, tg.a, e.n, 'spell'); continue; }
          const l = live(state, tg);
          if (l) damageUnit(state, tg.a, l.slot, e.n, 'spell', e.pierce);
        }
        break;
      }
      case 'heal':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          if (tg.kind === 'avatar') { healAvatar(state, tg.a, e.n); continue; }
          const l = live(state, tg);
          if (l) healUnit(state, tg.a, l.slot, e.n);
        }
        break;
      case 'buff':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          if (tg.kind !== 'unit') continue;
          const l = live(state, tg); if (!l) continue;
          const u = l.u;
          if (!u) continue;
          if (e.until === 'round') { u.tempAtk += e.atk || 0; }
          else { u.buffAtk += e.atk || 0; u.buffHp += e.hp || 0; u.maxHp += e.hp || 0; u.hp += e.hp || 0; }
          log(state, {t: 'buff', a: tg.a, slot: tg.slot, atk: e.atk || 0, hp: e.hp || 0, until: e.until || 'perm'});
        }
        break;
      case 'temp-atk-all': {
        for (const tg of resolveTarget(state, a, 'all-friendly-units', ctx)) {
          const u = player(state, tg.a).board[tg.slot]; if (u) u.tempAtk += e.n;
        }
        log(state, {t: 'temp-atk-all', a, n: e.n});
        break;
      }
      case 'give-kw':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          const l = live(state, tg); if (!l) continue;
          if (!hasKw(l.u, e.kw)) { l.u.kw.push(e.kw); log(state, {t: 'give-kw', a: tg.a, slot: l.slot, kw: e.kw}); }
        }
        break;
      case 'draw': for (let k = 0; k < e.n; k++) drawCard(state, a); break;
      case 'summon': {
        const p = player(state, a);
        const times = e.n || 1;
        for (let k = 0; k < times && p.board.length < BOARD_SLOTS; k++) {
          const def = cardById[e.card];
          if (!def) break;
          const u = unit(uidSeq++, def, p.board.length);
          if (e.sick === false) u.summoningSick = false;
          enterUnit(state, a, u);
          p.board.push(u);
          log(state, {t: 'summon', a, slot: p.board.length - 1, card: e.card, uid: u.uid, via: 'effect'});
        }
        break;
      }
      case 'corrupt':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          const l = live(state, tg); if (!l) continue;
          if (!hasKw(l.u, 'celik')) { l.u.corrupted += e.n || 1; log(state, {t: 'corrupt', a: tg.a, slot: l.slot, n: e.n || 1}); }
        }
        break;
      case 'cleanse':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          const l = live(state, tg); if (!l) continue;
          if (l.u.corrupted) { l.u.corrupted = 0; log(state, {t: 'cleanse', a: tg.a, slot: l.slot}); }
        }
        break;
      case 'return':
      case 'return-strongest': {
        const spec = e.t === 'return' ? e.target : 'strongest-enemy';
        for (const tg of resolveTarget(state, a, spec, ctx)) {
          const l = live(state, tg); if (!l) continue;
          const owner = player(state, tg.a);
          if (owner.hand.length < MAX_HAND) {
            owner.hand.push(l.u.id);
            removeFromBoard(state, tg.a, l.slot);
            log(state, {t: 'return', a: tg.a, card: l.u.id, via: e.t === 'return' ? 'spell' : 'correction'});
          }
        }
        break;
      }
      case 'revive': {
        const p = player(state, a);
        const pool = [...new Set(p.dead)];
        const pickN = e.n === 'all' ? pool.length : (e.n || 1);
        for (const id of pool.slice(-pickN)) {
          if (p.board.length >= BOARD_SLOTS) break;
          const def = cardById[id];
          if (!def || def.kind === 'spell') continue;
          const u = unit(uidSeq++, def, p.board.length);
          if (e.atk || e.hp) { u.buffAtk += e.atk || 0; u.buffHp += e.hp || 0; u.maxHp += e.hp || 0; u.hp += e.hp || 0; }
          u.atk = Math.max(1, u.atk); u.maxHp = Math.max(1, u.maxHp); u.hp = Math.max(1, u.hp);
          u.summoningSick = false;
          enterUnit(state, a, u);
          p.board.push(u);
          log(state, {t: 'revive', a, card: id, slot: p.board.length - 1});
        }
        break;
      }
      case 'hatira': gainHatira(state, a, e.n, 'card'); break;
      case 'silence':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          const l = live(state, tg); if (!l) continue;
          l.u.kw = []; l.u.corrupted = 0; log(state, {t: 'silence', a: tg.a, slot: l.slot});
        }
        break;
      case 'copy-weak': { // Yankı: put a weakened echo of target into hand
        const tg = ctx.target;
        if (tg && tg.kind === 'unit') {
          const u = player(state, tg.a).board[tg.slot];
          if (u && player(state, a).hand.length < MAX_HAND) {
            player(state, a).hand.push(u.id + '#weak');
            log(state, {t: 'echo-copy', a, card: u.id});
          }
        }
        break;
      }
      case 'stun':
        for (const tg of resolveTarget(state, a, e.target, ctx)) {
          const l = live(state, tg); if (!l) continue;
          l.u.stunned = true; log(state, {t: 'stun', a: tg.a, slot: l.slot});
        }
        break;
      case 'transform': {
        const tg = ctx.self || (ctx.target?.kind === 'unit' ? ctx.target : null);
        if (!tg) break;
        const b = player(state, tg.a).board;
        const idx = b.findIndex(u => u.uid === tg.uid);
        const def = cardById[e.card];
        if (idx < 0 || !def) break;
        const fresh = unit(uidSeq++, def, idx);
        fresh.summoningSick = false;
        enterUnit(state, tg.a, fresh);
        b[idx] = fresh;
        log(state, {t: 'transform', a: tg.a, slot: idx, card: e.card});
        break;
      }
      case 'draw-tag': {
        const p = player(state, a);
        const n = e.n || 1;
        for (let k = 0; k < n; k++) {
          const idx = p.deck.findIndex(id => {
            const d = cardById[id.replace('#weak', '')];
            return d && (d.group === e.group || (d.tags || []).includes(e.group));
          });
          if (idx < 0) break;
          if (p.hand.length >= MAX_HAND) { log(state, {t: 'burn', a, card: p.deck[idx]}); p.deck.splice(idx, 1); continue; }
          p.hand.push(p.deck.splice(idx, 1)[0]);
          log(state, {t: 'draw', a, tag: e.group});
        }
        break;
      }
      case 'mill': {
        const foe = player(state, other(a));
        for (let k = 0; k < (e.n || 1) && foe.deck.length; k++) {
          const gone = foe.deck.shift();
          log(state, {t: 'mill', a: other(a), card: gone});
        }
        break;
      }
      case 'shield': {
        const p = player(state, a);
        p.shield = (p.shield || 0) + (e.n || 1);
        log(state, {t: 'shield', a, n: e.n || 1, total: p.shield});
        break;
      }
    }
  }
}

// ---------- round flow ----------
function doMulligan(state, a, indices) {
  const p = player(state, a);
  if (state.phase !== 'mulligan') throw Error('Seçim evresi dışında.');
  if (p.mulliganDone) throw Error('Seçim zaten tamamlandı.');
  const idx = [...new Set(indices || [])].filter(i => Number.isInteger(i) && i >= 0 && i < p.hand.length);
  const back = idx.map(i => p.hand[i]);
  p.hand = p.hand.filter((_, i) => !idx.includes(i));
  p.deck = shuffle(state, p.deck.concat(back));
  for (let k = 0; k < idx.length; k++) drawCard(state, a, true);
  p.mulliganDone = true;
  log(state, {t: 'mulligan', a, n: idx.length});
  if (state.players.every(q => q.mulliganDone)) {
    state.phase = 'action';
    beginRound(state);
  } else {
    state.active = other(a);
  }
  return state;
}

function beginRound(state) {
  if (state.winner !== null) return;
  state.round++;
  for (let a = 0; a < 2; a++) {
    const p = player(state, a);
    // carryover: unspent öz becomes Anı (spell mana, cap 3)
    const carry = Math.min(ANI_CAP, p.oz);
    p.ani = Math.min(ANI_CAP, p.ani + carry);
    p.oz = Math.min(OZ_CAP, state.round);
    p.passed = false;
    p.flag = {};
    // echo returns: weakened echoes come back to hand
    for (const e of p.echoPool) if (p.hand.length < MAX_HAND) p.hand.push(e.card + '#weak');
    p.echoPool = [];
    // unit upkeep: clear temp buffs, heal (teom passive), corruption ticks
    for (let s = p.board.length - 1; s >= 0; s--) {
      const u = p.board[s];
      u.tempAtk = 0;
      u.summoningSick = false;
      u.stunned = false;
      const echo = ECHOES[p.avatar.echo];
      if (u.corrupted > 0 && !hasKw(u, 'celik')) damageUnit(state, a, s, u.corrupted, 'corruption');
      // turSonu-style upkeep trigger defined on the card (fires after ticks)
      const def = cardById[u.id];
      if (def?.turSonu && player(state, a).board[s] === u) runEffects(state, a, def.turSonu, {self: ref(u, a, s)});
    }
    // Miras: heal1 — most wounded friendly unit regains 1
    const echo = ECHOES[p.avatar.echo];
    if (echo && echo.passive === 'heal1') {
      let worst = -1, gap = 0;
      for (let s = 0; s < p.board.length; s++) {
        const g = p.board[s].maxHp - p.board[s].hp;
        if (g > gap) { gap = g; worst = s; }
      }
      if (worst >= 0) healUnit(state, a, worst, 1);
    }
    drawCard(state, a);
    gainHatira(state, a, 1, 'round');
  }
  state.active = state.token;
  log(state, {t: 'round', n: state.round, oz: state.players.map(p => p.oz)});
  checkEnd(state);
}
function bothPassed(state) { return state.players[0].passed && state.players[1].passed; }
function passTurn(state, a) {
  const p = player(state, a);
  p.passed = true;
  log(state, {t: 'pass', a});
  if (bothPassed(state)) {
    state.token = other(state.token);
    for (const pl of state.players) pl.passed = false;
    beginRound(state);
  } else {
    state.active = other(a);
  }
}

// ---------- card play ----------
function cardCost(state, a, id) {
  const def = cardById[id];
  if (!def) return null;
  let cost = def.cost;
  const av = player(state, a).avatar;
  const echo = ECHOES[av.echo];
  if (echo && echo.passive === 'spell-discount' && def.kind === 'spell' && !player(state, a).flag.discount) cost = Math.max(0, cost - 1);
  if (echo && echo.passive === 'discount' && !player(state, a).flag.discount) cost = Math.max(0, cost - 2);
  return cost;
}
function canPay(state, a, def, cost) {
  const p = player(state, a);
  if (def.kind === 'spell') return p.oz + p.ani >= cost;   // ani only feeds spells
  return p.oz >= cost;
}
function payCost(state, a, def, cost) {
  const p = player(state, a);
  if (def.kind === 'spell') {
    const fromAni = Math.min(p.ani, cost);
    p.ani -= fromAni;
    p.oz -= (cost - fromAni);
  } else {
    p.oz -= cost;
  }
}
function playableNow(state, a, def) {
  // speed rules: yavas only in action phase on your action, not during combat/response
  if (def.kind === 'spell' && def.speed === 'yavas') return state.phase === 'action' && state.active === a && !state.stack.length;
  if (state.phase === 'block') return def.kind === 'spell' && def.speed !== 'yavas';
  if (state.stack.length) return def.kind === 'spell' && def.speed !== 'yavas';
  return state.phase === 'action' && state.active === a;
}

function playCard(state, a, handIndex, target) {
  const p = player(state, a);
  const raw = p.hand[handIndex];
  if (raw === undefined) throw Error('Elde öyle kart yok.');
  const weak = raw.endsWith('#weak');
  const id = weak ? raw.slice(0, -5) : raw;
  const def = cardById[id];
  if (!def) throw Error('Bilinmeyen kart.');
  if (def.needsTarget && !validTarget(state, a, def, target)) throw Error('Geçerli hedef seç.');
  if (!playableNow(state, a, def)) throw Error('Bu kart şimdi oynanamaz.');
  let cost = cardCost(state, a, id);
  if (weak) cost = Math.max(0, def.cost - 1);
  if (!canPay(state, a, def, cost)) throw Error('Öz yetersiz.');

  p.hand.splice(handIndex, 1);
  payCost(state, a, def, cost);
  if (['spell-discount', 'discount'].includes(ECHOES[p.avatar.echo]?.passive) && !p.flag.discount && cost < def.cost) p.flag.discount = true;
  p.stats.played++;

  if (def.kind === 'unit' || def.kind === 'hero') {
    if (p.board.length >= BOARD_SLOTS) { p.hand.splice(handIndex, 0, raw); refund(state, a, def, cost); throw Error('Saf dolu (6).'); }
    const u = unit(uidSeq++, def, p.board.length);
    if (weak) { u.atk = Math.max(1, u.atk - 1); u.hp = u.maxHp = Math.max(1, u.maxHp - 1); u.echoOf = id; }
    enterUnit(state, a, u);
    p.board.push(u);
    log(state, {t: 'play', a, card: id, slot: p.board.length - 1, uid: u.uid, weak});
    if (def.cagri) runEffects(state, a, def.cagri, {target});
  } else {
    p.stats.spells++;
    gainHatira(state, a, 1, 'spell');
    if (def.speed === 'hizli') {
      state.stack.push({card: id, owner: a, target: target || null});
      log(state, {t: 'cast-fast', a, card: id});
      state.phase = state.phase === 'block' ? 'block' : 'action';
      state.active = other(a);           // response window
      player(state, a).passed = false;
      return state;
    }
    log(state, {t: 'cast', a, card: id});
    runEffects(state, a, def.effects || [], {target});
  }
  afterAction(state, a);
  return state;
}
function refund(state, a, def, cost) { player(state, a).oz += cost; }
function validTarget(state, a, def, target) {
  if (!def.needsTarget) return true;
  if (!target) return false;
  const want = def.needsTarget;
  if (want === 'enemy-unit') return target.a === other(a) && target.slot != null && player(state, target.a).board[target.slot];
  if (want === 'any-unit') return target.slot != null && player(state, target.a)?.board[target.slot];
  if (want === 'ally-unit') return target.a === a && target.slot != null && player(state, a).board[target.slot];
  if (want === 'enemy-avatar') return target.a === other(a) && target.kind === 'avatar';
  if (want === 'enemy-any') return target.a === other(a) && (target.kind === 'avatar' || player(state, target.a).board[target.slot]);
  return false;
}
function resolveStack(state) {
  let topCaster = null;                  // owner of the most recently cast (first resolved)
  while (state.stack.length) {
    const item = state.stack.pop();
    if (topCaster === null) topCaster = item.owner;
    const def = cardById[item.card];
    if (def && def.effects) runEffects(state, item.owner, def.effects, {target: item.target});
    log(state, {t: 'resolve', card: item.card, a: item.owner});
  }
  if (state.winner !== null) return;
  if (state.phase === 'block') {
    state.active = other(state.token);    // defender resumes assigning blocks
  } else if (topCaster !== null) {
    state.active = other(topCaster);      // the responding cast consumed its player's action
  }
}
function afterAction(state, a) {
  if (state.winner !== null) return;
  if (state.stack.length) return;          // response window stays open
  if (state.phase === 'block') return;     // combat flow continues via declare-block/pass
  player(state, a).passed = false;
  state.active = other(a);
}

// ---------- combat ----------
function declareAttack(state, a, slots) {
  if (state.phase !== 'action' || state.active !== a) throw Error('Şu an hamle sırası değil.');
  if (state.token !== a) throw Error('Taarruz jetonu sende değil.');
  const p = player(state, a);
  if (p.flag.attacked) throw Error('Bu tur zaten taarruz ettin.');
  const uniq = [...new Set(slots)];
  if (uniq.length > BOARD_SLOTS) throw Error('En fazla 6 saldıran.');
  const attackers = [];
  for (const s of uniq) {
    const u = p.board[s];
    if (!u) throw Error('Geçersiz saf konumu.');
    if (u.summoningSick) throw Error('Bu birim bu tur çağrıldı; henüz taarruz edemez.');
    if (u.stunned) throw Error('Sersemlemiş birim taarruz edemez.');
    if (effAtk(u) <= 0) throw Error('Saldırı gücü olmayan birim taarruz edemez.');
    attackers.push({slot: s, uid: u.uid});
  }
  // on-declare-attack triggers (Saldırı: effects)
  for (const atk of attackers) {
    const u = p.board[atk.slot];
    const def = u && cardById[u.id];
    if (def?.saldiri) runEffects(state, a, def.saldiri, {self: ref(u, a, atk.slot)});
  }
  // Miras: rally — first attacker gets +1 this combat
  const echo = ECHOES[p.avatar.echo];
  if (echo && echo.passive === 'rally' && attackers.length) {
    const u = p.board[attackers[0].slot];
    u.tempAtk += 1;
    log(state, {t: 'rally', a, slot: attackers[0].slot});
  }
  state.combat = {attackers, blockers: {}, resolved: false};
  state.phase = 'block';
  p.flag.attacked = true;
  p.stats.attacks++;
  log(state, {t: 'attack', a, slots: uniq});
  state.active = other(a);
  return state;
}
function declareBlock(state, a, pairs) {
  if (state.phase !== 'block') throw Error('Savunma aşaması değil.');
  const d = other(state.token);           // defender
  if (state.active !== a && a !== d) throw Error('Savunan sen değilsin.');
  const combat = state.combat;
  if (state.stack.length) throw Error('Önce bekleyen büyü çözülmeli.');
  const blockers = {};
  const used = new Set();
  for (let i = 0; i < combat.attackers.length; i++) {
    const bs = pairs && pairs[i] !== undefined ? pairs[i] : null;
    if (bs === null || bs === undefined) { blockers[i] = null; continue; }
    const u = player(state, a).board[bs];
    if (!u) throw Error('Geçersiz savunan konumu.');
    if (u.stunned) throw Error('Sersemlemiş birim savunamaz.');
    if (used.has(bs)) throw Error('Aynı birim iki saldırıyı savunamaz.');
    const atk = player(state, state.token).board[combat.attackers[i].slot];
    if (!atk) { blockers[i] = null; continue; }
    if (hasKw(atk, 'golge') && !hasKw(u, 'golge')) throw Error('Gölge birim yalnızca Gölge ile savunulur.');
    if (u.summoningSick) {/* units may block the turn they're summoned — allowed */}
    used.add(bs);
    blockers[i] = bs;
  }
  // resolving with stack support: resolve pending fast spells first? No — blockers lock now, then resolve.
  combat.blockers = blockers;
  log(state, {t: 'block', a, pairs: blockers});
  resolveCombat(state);
  return state;
}
function resolveCombat(state) {
  const A = state.token, D = other(A);
  const combat = state.combat;
  if (!combat || combat.resolved) return;
  if (state.stack.length) return;   // wait for responses
  combat.resolved = true;
  if (state.winner !== null) return;
  const atkP = player(state, A), defP = player(state, D);
  // Koruyucu (Guard): unblocked attackers are intercepted by the defender's guards in order
  const guards = defP.board.map((u, s) => s).filter(s => hasKw(defP.board[s], 'koruyucu') && !defP.board[s].stunned);
  for (let i = 0; i < combat.attackers.length; i++) {
    const bs = combat.blockers[i];
    if ((bs === null || bs === undefined) && guards.length) combat.blockers[i] = guards.shift();
  }
  // first strike pass (çabuk)
  for (let i = 0; i < combat.attackers.length; i++) {
    const atkU = atkP.board[combat.attackers[i].slot];
    const bs = combat.blockers[i];
    const blkU = bs === null || bs === undefined ? null : defP.board[bs];
    if (!atkU) continue;
    if (blkU && hasKw(atkU, 'cabuk')) {
      strikeUnit(state, A, combat.attackers[i].slot, D, bs);
    }
  }
  // simultaneous strikes
  for (let i = 0; i < combat.attackers.length; i++) {
    const atkIdx = combat.attackers[i].slot;
    const atkU = atkP.board[atkIdx];
    if (!atkU) continue;
    const bs = combat.blockers[i];
    const blkU = bs === null || bs === undefined ? null : defP.board[bs];
    if (blkU) {
      if (hasKw(atkU, 'cabuk')) {
        if (isAlive(blkU)) strikeBack(state, D, bs, A, atkIdx); // blocker survived quick strike
        continue;
      }
      mutualStrike(state, A, atkIdx, D, bs);
    } else {
      strikeAvatar(state, A, atkIdx, D);
    }
  }
  state.combat = null;
  if (state.winner === null) {
    state.phase = 'action';
    state.active = A;   // attacker continues their action phase (LoR: attack consumes turn action but play continues)
    player(state, A).passed = false;
  }
  checkEnd(state);
}
function strikeUnit(state, A, ai, D, bi) {
  const atkU = player(state, A).board[ai], blkU = player(state, D).board[bi];
  if (!atkU || !blkU) return;
  let dmg = effAtk(atkU);
  if (hasKw(atkU, 'celik') && blkU.group === 'karah') dmg += 2;
  if (hasKw(blkU, 'dayanikli')) dmg = Math.max(0, dmg - 1);
  blkU.hp -= dmg;
  player(state, A).stats.dmgDealt += dmg;
  if (dmg > 0 && hasKw(atkU, 'canavar')) healAvatar(state, A, dmg);
  log(state, {t: 'strike', a: A, from: ai, to: bi, n: dmg});
  if (blkU.hp <= 0) {
    // Ezici: excess carries to avatar only vs blocks? (LoR: no — overwhelm excess hits nexus on blocked too)
    if (hasKw(atkU, 'ezici')) {
      const over = -blkU.hp;
      if (over > 0) damageAvatar(state, D, over, 'overwhelm');
    }
    killUnit(state, D, bi, 'combat', {killer: atkU, killerA: A});
  }
}
function strikeBack(state, D, bi, A, ai) {
  const atkU = player(state, A).board[ai], blkU = player(state, D).board[bi];
  if (!atkU || !blkU) return;
  let dmg = effAtk(blkU);
  if (hasKw(blkU, 'celik') && atkU.group === 'karah') dmg += 2;
  if (hasKw(atkU, 'dayanikli')) dmg = Math.max(0, dmg - 1);
  atkU.hp -= dmg;
  if (dmg > 0 && hasKw(blkU, 'canavar')) healAvatar(state, D, dmg);
  log(state, {t: 'strike-back', a: D, from: bi, to: ai, n: dmg});
  if (atkU.hp <= 0) killUnit(state, A, ai, 'combat', {killer: blkU, killerA: D});
}
function mutualStrike(state, A, ai, D, bi) {
  const atkU = player(state, A).board[ai], blkU = player(state, D).board[bi];
  if (!atkU || !blkU) return;
  const aDmg = Math.max(0, effAtk(atkU) + (hasKw(atkU, 'celik') && blkU.group === 'karah' ? 2 : 0) - (hasKw(blkU, 'dayanikli') ? 1 : 0));
  const bDmg = Math.max(0, effAtk(blkU) + (hasKw(blkU, 'celik') && atkU.group === 'karah' ? 2 : 0) - (hasKw(atkU, 'dayanikli') ? 1 : 0));
  player(state, A).stats.dmgDealt += aDmg;
  atkU.hp -= bDmg; blkU.hp -= aDmg;
  if (aDmg > 0 && hasKw(atkU, 'canavar')) healAvatar(state, A, aDmg);
  if (bDmg > 0 && hasKw(blkU, 'canavar')) healAvatar(state, D, bDmg);
  log(state, {t: 'clash', A, ai, D, bi, aDmg, bDmg});
  if (blkU.hp <= 0) {
    if (hasKw(atkU, 'ezici')) { const over = -blkU.hp; if (over > 0) damageAvatar(state, D, over, 'overwhelm'); }
    killUnit(state, D, bi, 'combat', {killer: atkU, killerA: A});
  }
  if (atkU.hp <= 0) killUnit(state, A, ai, 'combat', {killer: blkU, killerA: D});
}
function strikeAvatar(state, A, ai, D) {
  const atkU = player(state, A).board[ai];
  if (!atkU) return;
  const dmg = effAtk(atkU);
  player(state, A).stats.dmgDealt += dmg;
  if (dmg > 0 && hasKw(atkU, 'canavar')) healAvatar(state, A, dmg);
  log(state, {t: 'face', a: A, from: ai, n: dmg});
  damageAvatar(state, D, dmg, 'attack');
}

// ---------- echo ultimate ----------
function useUltimate(state, a) {
  const p = player(state, a);
  const av = p.avatar;
  const echo = ECHOES[av.echo];
  if (!echo || !echo.ultimate) throw Error('Bu Yankının nihai yeteneği yok.');
  if (av.ultUsed) throw Error('Nihai yetenek bu maçta kullanıldı.');
  if (av.hatira < HATIRA_CAP) throw Error(`Hatıra yetersiz (${av.hatira}/${HATIRA_CAP}).`);
  if (state.phase !== 'action' || state.active !== a || state.stack.length) throw Error('Şu an kullanılamaz.');
  av.hatira = 0; av.ultUsed = true;
  log(state, {t: 'ultimate', a, echo: av.echo});
  runEffects(state, a, echo.ultimate.effects, {});
  afterAction(state, a);
  return state;
}

// ---------- public API ----------
export function command(state, actor, cmd) {
  if (state.winner !== null) throw Error('Maç bitti.');
  const s = clone(state);
  if (s.phase === 'mulligan' && cmd?.type !== 'concede') {
    if (cmd?.type !== 'mulligan') throw Error('Önce seçim evresini tamamla.');
    return doMulligan(s, actor, cmd.indices || cmd.cards || []);
  }
  switch (cmd?.type) {
    case 'mulligan': throw Error('Seçim evresi çoktan kapandı.');
    case 'play': return playCard(s, actor, cmd.hand, cmd.target);
    case 'attack': return declareAttack(s, actor, cmd.slots);
    case 'block': return declareBlock(s, actor, cmd.pairs);
    case 'pass': {
      if (s.stack.length) {
        if (actor === s.stack[s.stack.length - 1].owner) throw Error('Kendi büyüne yanıt veremezsin.');
        // response declined — resolve the whole stack
        resolveStack(s);
        return s;
      }
      if (s.phase === 'block') {
        // defender must commit blocks (possibly none); attacker can't pass here
        if (actor !== other(s.token)) throw Error('Savunan oyuncu karar vermeli.');
        return declareBlock(s, actor, {});
      }
      passTurn(s, actor); return s;
    }
    case 'ultimate': return useUltimate(s, actor);
    case 'concede': {
      s.winner = other(actor);
      log(s, {t: 'concede', a: actor});
      return s;
    }
    default: throw Error('Bilinmeyen komut.');
  }
}

// ---------- hidden-information view ----------
export function viewFor(state, actor) {
  const s = clone(state);
  const me = s.players[actor], foe = s.players[other(actor)];
  foe.deck = foe.deck.length;
  foe.hand = foe.hand.map(() => 'back');
  foe.echoPool = foe.echoPool.length;
  me.viewActor = actor;
  // last events for animation replay (only public info already in events)
  s.lastEvents = s.events.slice(-12);
  s.events = [];
  return s;
}

// ---------- heuristic bot ----------
export function botCommand(state, a = 1) {
  const s = state;
  const me = s.players[a], foe = s.players[other(a)];

  if (s.phase === 'mulligan') {
    if (me.mulliganDone) return {type: 'pass'};
    // keep cheap cards; send back anything costing more than 4
    const indices = me.hand.map((id, i) => ({id, i}))
      .filter(x => (cardById[x.id.replace('#weak', '')]?.cost ?? 0) > 4)
      .map(x => x.i);
    return {type: 'mulligan', indices};
  }

  if (s.phase === 'block' && s.token !== a) {
    // respond to attacker's fast spells first? bot plays none — just pass through
    if (s.stack.length) return {type: 'pass'};
    // defend: greedily block biggest attackers with best trades
    const pairs = {};
    const defenders = me.board.map((u, i) => ({u, i})).filter(x => x.u.hp > 0 && !x.u.stunned);
    const order = s.combat.attackers.map((atk, i) => ({atk, i, v: effAtk(s.players[s.token].board[atk.slot] || {atk: 0, buffAtk: 0, tempAtk: 0})}))
      .sort((x, y) => y.v - x.v);
    const used = new Set();
    for (const {atk, i, v} of order) {
      const atkU = s.players[s.token].board[atk.slot];
      if (!atkU) continue;
      // pick smallest defender that kills or cheapest blocker for golge rule
      const cands = defenders.filter(d => !used.has(d.i) && (!hasKw(atkU, 'golge') || hasKw(d.u, 'golge')));
      if (!cands.length) continue;
      cands.sort((x, y) => (effAtk(x.u) >= blkHp(atkU) ? 0 : 1) - (effAtk(y.u) >= blkHp(atkU) ? 0 : 1) || x.u.hp - y.u.hp);
      const pick = cands.find(d => effAtk(d.u) >= atkU.hp || d.u.hp > v) || (myAvatarHp(me) <= v + 4 ? cands[0] : null);
      if (pick) { pairs[i] = pick.i; used.add(pick.i); }
    }
    return {type: 'block', pairs};
  }

  if (s.phase !== 'action' || s.active !== a) return {type: 'pass'};

  // stack response: play a damage fast spell at the attacker if useful? keep simple — pass
  if (s.stack.length && s.stack[s.stack.length - 1].owner !== a) return {type: 'pass'};

  // ultimate when charged and behind or lethal setup
  if (me.avatar.hatira >= HATIRA_CAP && !me.avatar.ultUsed) {
    if (me.avatar.hp <= 12 || foe.board.length >= 3) return {type: 'ultimate'};
  }

  // pick a target for any needsTarget card
  const pickTarget = (def) => {
    if (!def.needsTarget) return null;
    const foes = foe.board.map((u, i) => ({u, i})).sort((x, y) => effAtk(y.u) - effAtk(x.u));
    const mine = me.board.map((u, i) => ({u, i})).sort((x, y) => effAtk(y.u) - effAtk(x.u));
    switch (def.needsTarget) {
      case 'enemy-unit': return foes.length ? {a: other(a), slot: foes[0].i} : null;
      case 'ally-unit': return mine.length ? {a, slot: mine[0].i} : null;
      case 'any-unit': return foes.length ? {a: other(a), slot: foes[0].i} : (mine.length ? {a, slot: mine[0].i} : null);
      case 'enemy-avatar': case 'enemy-any': return {a: other(a), kind: 'avatar'};
      default: return null;
    }
  };

  // play units greedily (best stat-per-cost affordable); skip cards without a legal target
  const playables = me.hand.map((raw, idx) => ({raw, idx, def: cardById[raw.replace('#weak', '')]}))
    .filter(x => x.def && (x.def.kind !== 'spell') && playableNow(s, a, x.def) && canPay(s, a, x.def, cardCost(s, a, x.def.id) ?? 99))
    .map(x => ({...x, target: x.def.needsTarget ? pickTarget(x.def) : null}))
    .filter(x => !x.def.needsTarget || x.target);
  if (playables.length && me.board.length < BOARD_SLOTS) {
    playables.sort((x, y) => (y.def.atk + y.def.hp) - (x.def.atk + x.def.hp));
    return {type: 'play', hand: playables[0].idx, target: playables[0].target};
  }

  // cast damage/removal fast or slow spells on biggest threat
  const spellIdx = me.hand.findIndex((raw, i) => {
    const def = cardById[raw.replace('#weak', '')];
    if (!def || def.kind !== 'spell' || !playableNow(s, a, def)) return false;
    return canPay(s, a, def, cardCost(s, a, def.id) ?? 99);
  });
  if (spellIdx >= 0) {
    const raw = me.hand[spellIdx];
    const def = cardById[raw.replace('#weak', '')];
    const target = pickTarget(def);
    if (def.needsTarget && !target) return tryAttackOrPass(s, a);
    return {type: 'play', hand: spellIdx, target};
  }

  return tryAttackOrPass(s, a);
}
function blkHp(u) { return u.hp; }
function myAvatarHp(p) { return p.avatar.hp; }
function tryAttackOrPass(s, a) {
  const me = s.players[a];
  if (s.token === a && s.phase === 'action' && s.active === a && !me.flag.attacked) {
    const ready = me.board.map((u, i) => ({u, i})).filter(x => !x.u.summoningSick && !x.u.stunned && effAtk(x.u) > 0);
    // attack if we'd push meaningful damage or win trades; simple: attack with all ready when board nonempty
    if (ready.length) return {type: 'attack', slots: ready.map(x => x.i)};
  }
  return {type: 'pass'};
}

export const internals = {effAtk, hasKw, cardCost, canPay, playableNow, HATIRA_CAP, BOARD_SLOTS, MAX_HAND};
