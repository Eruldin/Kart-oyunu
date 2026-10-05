import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMatch, command, viewFor, botCommand, internals} from '../packages/engine/index.mjs';
import {cardById, defaultDeck, enemyDeck, chapters, ECHOES} from '../packages/content/cards.mjs';

const DECK_A = defaultDeck, DECK_B = enemyDeck;
// complete the mulligan for both sides so the match is in 'action' phase
function skipMulligan(state) {
  if (state.phase !== 'mulligan') return state;
  state = command(state, 0, {type: 'mulligan', indices: []});
  state = command(state, 1, {type: 'mulligan', indices: []});
  return state;
}
function fresh(opts = {}) {
  const s = createMatch({seed: 42, echo: ['ash', 'ash'], health: [24, 24], decks: [DECK_A, DECK_B], ...opts});
  return skipMulligan(s);
}
// drive state until a predicate or safety cap; bots pick commands for both players
function drive(state, pred, cap = 2000) {
  let steps = 0;
  while (!pred(state) && steps++ < cap) {
    const actor = state.phase === 'block' ? 1 - state.token
      : state.stack.length ? state.active
      : state.active;
    const cmd = botCommand(state, actor);
    state = command(state, actor, cmd);
  }
  return state;
}

test('content integrity: decks legal, chapters valid', () => {
  assert.equal(DECK_A.length, 20);
  assert.equal(DECK_B.length, 20);
  for (const d of [DECK_A, DECK_B]) {
    const c = {};
    for (const id of d) { c[id] = (c[id] || 0) + 1; assert.ok(cardById[id], 'unknown ' + id); }
    for (const [id, n] of Object.entries(c)) assert.ok(n <= 3, id + ' x' + n);
  }
  for (const ch of chapters) {
    assert.ok(ch.deck.every(id => cardById[id]));
    assert.ok(ECHOES[ch.echo]);
  }
  for (const c of Object.values(cardById)) {
    assert.ok(c.name?.tr && c.name?.en, c.id + ' needs names');
    if (c.kind !== 'spell') { assert.ok(c.atk > 0 && c.hp > 0, c.id); }
    if (c.needsTarget) assert.ok(c.cagri || c.effects, c.id + ' targeted needs effects');
  }
});

test('match creation: deterministic, mulligan phase then round 1 resources', () => {
  const raw = createMatch({seed: 42, echo: ['ash', 'ash'], health: [24, 24], decks: [DECK_A, DECK_B]});
  assert.equal(raw.phase, 'mulligan');
  assert.equal(raw.players[0].hand.length, 4);
  assert.equal(raw.players[0].deck.length, 16);
  assert.throws(() => command(raw, 0, {type: 'pass'}), /seçim/i);
  // mulligan swaps selected cards back and redraws
  const keep = command(raw, 0, {type: 'mulligan', indices: [0, 1]});
  assert.equal(keep.players[0].hand.length, 4);
  assert.ok(keep.players[0].mulliganDone);
  assert.equal(keep.phase, 'mulligan');           // still waiting on player 1
  const both = command(keep, 1, {type: 'mulligan', indices: []});
  assert.equal(both.phase, 'action');
  const a = fresh(), b = fresh();
  assert.deepEqual(a.players[0].hand, b.players[0].hand);
  assert.equal(a.players[0].hand.length, 5);   // 4 opening + 1 draw
  assert.equal(a.round, 1);
  assert.equal(a.players[0].oz, 1);
  assert.equal(a.players[0].avatar.hp, 24);
});

test('command never mutates input state', () => {
  const s0 = fresh();
  const snap = JSON.stringify(s0);
  try { command(s0, s0.active, {type: 'pass'}); } catch {}
  assert.equal(JSON.stringify(s0), snap);
});

test('viewFor hides opponent hand and deck', () => {
  const s = viewFor(fresh(), 0);
  assert.equal(typeof s.players[1].deck, 'number');
  assert.ok(s.players[1].hand.every(c => c === 'back'));
  assert.ok(s.players[0].hand.every(c => typeof c === 'string' && c !== 'back'));
});

test('play unit spends öz and places on board', () => {
  let s = fresh();
  const me = s.active;
  const idx = s.players[me].hand.findIndex(id => cardById[id.replace('#weak', '')].cost <= 1 && cardById[id.replace('#weak', '')].kind !== 'spell');
  if (idx === -1) return; // hand had no 1-drop; still fine
  const before = s.players[me].oz;
  s = command(s, me, {type: 'play', hand: idx});
  assert.ok(s.players[me].board.length === 1);
  assert.ok(s.players[me].oz < before);
  assert.equal(s.active, 1 - me); // action passed
});

test('attack token required; face damage lands', () => {
  let s = fresh();
  // give player 0 a board: cheat via direct state edit for focused test
  const st = JSON.parse(JSON.stringify(s));
  st.players[0].board.push({uid: 901, id: 'torg', name: cardById.torg.name, kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3, maxHp: 3, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}});
  st.players[0].oz = 5;
  s = command(st, 0, {type: 'attack', slots: [0]});
  assert.equal(s.phase, 'block');
  s = command(s, 1, {type: 'block', pairs: {}});   // no blockers
  assert.equal(s.players[1].avatar.hp, 24 - 2 - 1); // 2 atk + 1 rally (ash)
});

test('no rally for non-ash echo', () => {
  let s = fresh({echo: ['white', 'ash']});
  const st = JSON.parse(JSON.stringify(s));
  st.players[0].board.push({uid: 902, id: 'torg', name: cardById.torg.name, kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3, maxHp: 3, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}});
  s = command(st, 0, {type: 'attack', slots: [0]});
  s = command(s, 1, {type: 'block', pairs: {}});
  assert.equal(s.players[1].avatar.hp, 22);
});

test('dayanikli reduces damage by 1', () => {
  let s = fresh();
  const st = JSON.parse(JSON.stringify(s));
  const mk = (id, uid) => ({uid, id, name: cardById[id].name, kind: 'unit', group: 'x', cost: 1, atk: 3, hp: 3, maxHp: 3, kw: [...cardById[id].kw], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}});
  const a = mk('pasli-kanca', 910); a.atk = 3;              // attacker
  const b = mk('koru-muhafiz', 911); b.atk = 1; b.hp = 3;    // dayanikli defender
  st.players[0].board.push(a); st.players[1].board.push(b);
  st.players[0].avatar.echo = 'white';                        // no rally
  s = command(st, 0, {type: 'attack', slots: [0]});
  s = command(s, 1, {type: 'block', pairs: {0: 0}});
  // 3 atk vs dayanikli 3hp → 2 dmg → 1 hp left; defender 1 atk vs 3hp → nothing lethal
  assert.equal(s.players[1].board[0].hp, 1);
  assert.equal(s.players[0].board[0].hp, 3 - Math.max(0, 1 - 0));
});

test('ezici overflow hits avatar', () => {
  let s = fresh();
  const st = JSON.parse(JSON.stringify(s));
  const a = {uid: 920, id: 'katran-emici', name: cardById['katran-emici'].name, kind: 'unit', group: 'karah', cost: 4, atk: 5, hp: 4, maxHp: 4, kw: ['ezici'], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  const b = {uid: 921, id: 'gri-kelebek', name: cardById['gri-kelebek'].name, kind: 'unit', group: 'konsey', cost: 1, atk: 1, hp: 1, maxHp: 1, kw: ['golge'], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  st.players[0].board.push(a); st.players[1].board.push(b);
  st.players[0].avatar.echo = 'white';
  s = command(st, 0, {type: 'attack', slots: [0]});
  s = command(s, 1, {type: 'block', pairs: {0: 0}});
  assert.equal(s.players[1].avatar.hp, 24 - 4); // 5 atk - 1 hp = 4 overflow
  assert.equal(s.players[1].board.length, 0);
});

test('golge only blockable by golge', () => {
  let s = fresh();
  const st = JSON.parse(JSON.stringify(s));
  const a = {uid: 930, id: 'gri-kelebek', name: cardById['gri-kelebek'].name, kind: 'unit', group: 'konsey', cost: 1, atk: 1, hp: 1, maxHp: 1, kw: ['golge'], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  const b = {uid: 931, id: 'torg', name: cardById.torg.name, kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3, maxHp: 3, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  st.players[0].board.push(a); st.players[1].board.push(b);
  st.players[0].avatar.echo = 'white';
  s = command(st, 0, {type: 'attack', slots: [0]});
  assert.throws(() => command(s, 1, {type: 'block', pairs: {0: 0}}), /Gölge/);
  s = command(s, 1, {type: 'block', pairs: {}});
  assert.equal(s.players[1].avatar.hp, 23);
});

test('cabuk strikes first and avoids counterstrike', () => {
  let s = fresh();
  const st = JSON.parse(JSON.stringify(s));
  const a = {uid: 940, id: 'fiona', name: cardById.fiona.name, kind: 'hero', group: 'direnis', cost: 6, atk: 5, hp: 5, maxHp: 5, kw: ['cabuk'], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  const b = {uid: 941, id: 'torg', name: cardById.torg.name, kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3, maxHp: 3, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  st.players[0].board.push(a); st.players[1].board.push(b);
  st.players[0].avatar.echo = 'white';
  s = command(st, 0, {type: 'attack', slots: [0]});
  s = command(s, 1, {type: 'block', pairs: {0: 0}});
  assert.equal(s.players[1].board.length, 0);      // torg died
  assert.equal(s.players[0].board[0].hp, 5);       // fiona untouched
});

test('fast spell stack: response window then LIFO resolve', () => {
  let s = fresh({echo: ['white', 'ash']});
  const st = JSON.parse(JSON.stringify(s));
  st.players[0].hand = ['beyaz-bosluk'];    // hizli, returns enemy unit
  st.players[1].hand = ['secilmis-aile'];   // hizli, buffs ally unit
  st.players[0].oz = 5; st.players[0].ani = 3;
  st.players[1].oz = 5; st.players[1].ani = 3;
  const mk = (uid) => ({uid, id: 'torg', name: cardById.torg.name, kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3, maxHp: 3, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}});
  st.players[1].board.push(mk(951));
  s = st;
  // p0 casts Beyaz Boşluk at p1's unit
  s = command(s, 0, {type: 'play', hand: 0, target: {a: 1, slot: 0}});
  assert.equal(s.stack.length, 1);
  assert.equal(s.active, 1);                        // response window
  // p1 responds with Seçilmiş Aile on own unit
  s = command(s, 1, {type: 'play', hand: 0, target: {a: 1, slot: 0}});
  assert.equal(s.stack.length, 2);
  assert.equal(s.active, 0);
  // p0 declines → resolve LIFO: buff first, then the return
  s = command(s, 0, {type: 'pass'});
  assert.equal(s.stack.length, 0);
  assert.equal(s.players[1].board.length, 0);       // unit returned to hand
  assert.ok(s.players[1].hand.includes('torg'));
  assert.equal(s.active, 0);                        // responder's cast consumed the action
});

test('corruption ticks at owner round start; celik immune', () => {
  const st = JSON.parse(JSON.stringify(fresh()));
  const u = {uid: 960, id: 'torg', name: cardById.torg.name, kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3, maxHp: 3, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 2, summoningSick: false, echoOf: null, flag: {}};
  const u2 = {uid: 961, id: 'gorn', name: cardById.gorn.name, kind: 'unit', group: 'direnis', cost: 4, atk: 4, hp: 4, maxHp: 4, kw: ['celik'], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 2, summoningSick: false, echoOf: null, flag: {}};
  st.players[0].board.push(u, u2);
  // simulate round start by calling both players pass twice
  let s = command(st, st.active, {type: 'pass'});
  s = command(s, s.active, {type: 'pass'});   // both passed → beginRound
  assert.equal(s.players[0].board[0].hp, 1);  // 3 - 2 corruption
  assert.equal(s.players[0].board[1].hp, 4);  // celik immune
});

test('yanki unit returns as weak echo next round', () => {
  const st = JSON.parse(JSON.stringify(fresh()));
  const u = {uid: 970, id: 'maestro-borislav', name: cardById['maestro-borislav'].name, kind: 'hero', group: 'notr', cost: 2, atk: 1, hp: 2, maxHp: 2, kw: ['yanki'], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  st.players[0].board.push(u);
  st.players[0].hand = [];
  // kill it via corruption-like damage: attack into bigger blocker
  const b = {uid: 971, id: 'katran-emici', name: cardById['katran-emici'].name, kind: 'unit', group: 'karah', cost: 4, atk: 5, hp: 4, maxHp: 4, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  st.players[1].board.push(b);
  st.players[0].avatar.echo = 'white';
  let s = command(st, 0, {type: 'attack', slots: [0]});
  s = command(s, 1, {type: 'block', pairs: {0: 0}});
  assert.equal(s.players[0].board.length, 0);
  assert.equal(s.players[0].echoPool.length, 1);
  // pass both → next round → weak echo in hand
  s = command(s, s.active, {type: 'pass'});
  s = command(s, s.active, {type: 'pass'});
  assert.ok(s.players[0].hand.includes('maestro-borislav#weak'));
});

test('ultimate requires 6 hatira and fires once', () => {
  const st = JSON.parse(JSON.stringify(fresh({echo: ['teom', 'ash']})));
  st.players[0].avatar.hatira = 5;
  assert.throws(() => command(st, 0, {type: 'ultimate'}), /Hatıra/);
  st.players[0].avatar.hatira = 6;
  const b = {uid: 980, id: 'karah-yavru', name: cardById['karah-yavru'].name, kind: 'unit', group: 'karah', cost: 1, atk: 2, hp: 1, maxHp: 1, kw: [], art: '', buffAtk: 0, buffHp: 0, tempAtk: 0, corrupted: 0, summoningSick: false, echoOf: null, flag: {}};
  st.players[1].board.push(b);
  st.players[0].avatar.hp = 10;
  let s = command(st, 0, {type: 'ultimate'});
  assert.equal(s.players[1].board.length, 0);   // judgement killed the spawn
  assert.equal(s.players[0].avatar.hp, 13);      // +3 heal
  assert.equal(s.players[0].avatar.hatira, 0);
  assert.throws(() => command(s, 0, {type: 'ultimate'}), /kullanıldı|hamle/);
});

test('bots finish a game deterministically', () => {
  let s = fresh({seed: 777});
  let steps = 0;
  while (s.winner === null && steps++ < 3000) {
    const actor = s.phase === 'block' ? 1 - s.token : s.active;
    s = command(s, actor, botCommand(s, actor));
  }
  assert.notEqual(s.winner, null);
  assert.ok(s.round >= 3);
  // determinism: same seed replay gives identical final hp
  let s2 = fresh({seed: 777});
  steps = 0;
  while (s2.winner === null && steps++ < 3000) {
    const actor = s2.phase === 'block' ? 1 - s2.token : s2.active;
    s2 = command(s2, actor, botCommand(s2, actor));
  }
  assert.equal(s2.winner, s.winner);
  assert.equal(s2.players[0].avatar.hp, s.players[0].avatar.hp);
});
