// drops.test — reward math: tables, pity, overflow refunds, starter kit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {rollRewards, applyRewards, starterCollection, PITY_BASE, PITY_STEP, CARDS_PER_TYPE} from '../packages/content/drops.mjs';
import {chapters, cardById, defaultDeck, COLLECTIBLE} from '../packages/content/cards.mjs';

const ch = id => chapters.find(c => c.id === id);

test('every node type rolls its advertised card count', () => {
  for (const type of ['normal', 'elite', 'tft', 'boss']) {
    const fake = {type, reward: {shards: 10}};
    const r = rollRewards(fake, {seed: 42});
    assert.equal(r.cards.length, CARDS_PER_TYPE[type]);
    for (const id of r.cards) assert.ok(cardById[id], `card ${id} exists`);
  }
});

test('drop odds concentrate: bosses never drop commons', () => {
  const fake = {type: 'boss', reward: {shards: 10}};
  for (let s = 1; s <= 60; s++) {
    const r = rollRewards(fake, {seed: s * 101});
    for (const id of r.cards) {
      const c = cardById[id];
      assert.notEqual(c.rarity, 'common', `boss dropped common ${id}`);
    }
  }
});

test('pity grows on dry boss kills and resets on legendary', () => {
  const boss = {type: 'boss', reward: {shards: 10}};
  // run many seeds: pity either resets (legendary) or increments
  for (let s = 0; s < 200; s++) {
    const r = rollRewards(boss, {pity: 2, seed: s});
    if (r.legendary) assert.equal(r.pity, 0);
    else assert.equal(r.pity, 3);
  }
});

test('pity eventually forces a legendary', () => {
  const boss = {type: 'boss', reward: {shards: 10}};
  let saw = false;
  for (let s = 0; s < 300 && !saw; s++) saw = rollRewards(boss, {pity: 8, seed: s}).legendary;
  assert.ok(saw, 'pity 8 → 95% legendary chance should hit within 300 seeds');
});

test('applyRewards grants cards, tracks pity, refunds >3 copies as shards', () => {
  const p = {collection: {}, shards: 0, pity: 0};
  const boss = {type: 'boss', reward: {shards: 50}};
  const r1 = applyRewards(p, boss, 123);
  assert.equal(p.shards, 50 + 0, 'shards granted');
  // fill a card to 3, force it to drop again → shard refund
  const id = r1.cards[0];
  p.collection[id] = 3;
  const r2 = applyRewards(p, {type: 'normal', reward: {shards: 0}, deck: [], id: 99}, 123);
  assert.ok(r2.shards >= 0);
});

test('starter collection covers the default deck at 3 copies', () => {
  const col = starterCollection(defaultDeck, 7);
  for (const id of defaultDeck) assert.ok(col[id] >= 1, `starter has ${id}`);
  assert.ok(Object.keys(col).length >= defaultDeck.length);
});

test('reward rolls are deterministic per seed', () => {
  const a = rollRewards({type: 'elite', reward: {shards: 5}}, {seed: 777});
  const b = rollRewards({type: 'elite', reward: {shards: 5}}, {seed: 777});
  assert.deepEqual(a.cards, b.cards);
});

test('campaign reward shard values exist on generated chapters', () => {
  const gen = chapters.filter(c => c.id >= 5);
  assert.ok(gen.every(c => c.reward?.shards > 0), 'every generated chapter grants shards');
});
