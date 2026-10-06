// tft.test — grid autobattle: determinism, keywords, formations, win paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate, bossFormation, GRID} from '../packages/engine/tft.mjs';
import {cardById, chapters} from '../packages/content/cards.mjs';

const u = id => ({cardId: id});

test('strong unit beats weak unit', () => {
  const r = simulate({player: [{cardId: 'akhenten', x: 3, y: 3}], enemy: [{cardId: 'torg', x: 3, y: 0}], seed: 1});
  assert.equal(r.winner, 0);
  assert.ok(r.log.some(e => e.ev === 'die'));
});

test('deterministic: same seed same result', () => {
  const a = simulate({player: [{cardId: 'torg', x: 2, y: 3}, {cardId: 'akhenten', x: 4, y: 3}], enemy: [{cardId: 'vesemir', x: 3, y: 0}], seed: 9});
  const b = simulate({player: [{cardId: 'torg', x: 2, y: 3}, {cardId: 'akhenten', x: 4, y: 3}], enemy: [{cardId: 'vesemir', x: 3, y: 0}], seed: 9});
  assert.deepEqual(a.units.map(u => [u.x, u.y, u.hp]), b.units.map(u => [u.x, u.y, u.hp]));
  assert.equal(a.winner, b.winner);
});

test('outnumbering wins: 3v1 synergy', () => {
  const r = simulate({
    player: [{cardId: 'torg', x: 2, y: 3}, {cardId: 'torg', x: 3, y: 3}, {cardId: 'torg', x: 4, y: 3}],
    enemy: [{cardId: 'akhenten', x: 3, y: 0}], seed: 3});
  assert.equal(r.winner, 0);
});

test('units must be unit/hero cards — spells rejected', () => {
  const spell = Object.values(cardById).find(c => c.kind === 'spell');
  assert.throws(() => simulate({player: [{cardId: spell.id, x: 0, y: 3}], enemy: [{cardId: 'torg', x: 0, y: 0}]}));
});

test('bossFormation produces a valid formation per chapter deck', () => {
  const tft = chapters.filter(c => c.type === 'tft');
  assert.ok(tft.length >= 6);
  for (const ch of tft) {
    const f = bossFormation(ch.deck, ch.seed);
    assert.ok(f.length >= 3, `ch ${ch.id} formation too small`);
    for (const u of f) {
      assert.ok(u.x >= 0 && u.x < GRID.w && u.y >= 0 && u.y <= 1, `ch ${ch.id} unit ${u.cardId} off-board`);
      assert.ok(cardById[u.cardId], u.cardId);
    }
  }
});

test('a full boss fight resolves within tick cap', () => {
  const ch = chapters.find(c => c.type === 'tft');
  const enemy = bossFormation(ch.deck, ch.seed);
  const player = enemy.map((e, i) => ({cardId: e.cardId, x: e.x, y: 3 - (e.y)})); // mirror
  const r = simulate({player, enemy, seed: 5});
  assert.ok(r.ticks <= 200);
  assert.ok([0, 1].includes(r.winner));
});
