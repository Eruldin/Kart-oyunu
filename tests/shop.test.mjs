// shop.test — packs, prices, cosmetics, equip rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {buyItem, rollPack, equipCosmetic, defaultCosmetics, SHOP_ITEMS, itemById, COSMETICS} from '../packages/content/shop.mjs';
import {cardById, defaultDeck, COLLECTIBLE} from '../packages/content/cards.mjs';
import {starterCollection} from '../packages/content/drops.mjs';

const mkProfile = (shards = 1000) => ({
  shards, collection: {}, cosmetics: defaultCosmetics(), packOpens: 0,
});

test('shop items have prices, names, valid slots', () => {
  for (const it of SHOP_ITEMS) {
    assert.ok(it.price > 0, it.id);
    assert.ok(it.name?.tr && it.name?.en, it.id);
    if (it.type === 'cosmetic') assert.ok(['back', 'board', 'ember'].includes(it.slot), it.id);
  }
});

test('pack-std guarantees at least one rare+', () => {
  for (let s = 1; s <= 50; s++) {
    const pulls = rollPack('pack-std', s * 977);
    const rank = {common: 0, rare: 1, epic: 2, legendary: 3};
    assert.ok(pulls.some(id => rank[cardById[id].rarity || 'common'] >= 1), `pack ${s} lacked rare+`);
    assert.equal(pulls.length, 5);
  }
});

test('pack-elite guarantees at least one epic+', () => {
  const rank = {common: 0, rare: 1, epic: 2, legendary: 3};
  for (let s = 1; s <= 50; s++) {
    const pulls = rollPack('pack-elite', s * 733);
    assert.ok(pulls.some(id => rank[cardById[id].rarity || 'common'] >= 2), `pack ${s} lacked epic+`);
  }
});

test('buyItem refuses when shards are short', () => {
  const p = mkProfile(10);
  const r = buyItem(p, 'pack-std');
  assert.equal(r.ok, false);
  assert.equal(p.shards, 10);
});

test('buyItem pack deducts price and grants cards', () => {
  const p = mkProfile(1000);
  const r = buyItem(p, 'pack-elite');
  assert.ok(r.ok);
  assert.equal(p.shards, 1000 - 140 + (r.refund || 0));
  assert.ok(r.pulls.length >= 1);
  assert.ok(Object.keys(p.collection).length >= 1);
});

test('cosmetics: buy once, auto-equip, cannot re-buy; equip toggles', () => {
  const p = mkProfile(500);
  const r = buyItem(p, 'back-red');
  assert.ok(r.ok);
  assert.equal(p.cosmetics.back, 'back-red');
  assert.equal(p.shards, 420);
  assert.equal(buyItem(p, 'back-red').ok, false, 're-buy rejected');
  assert.ok(equipCosmetic(p, 'back', 'back-ash'));
  assert.equal(p.cosmetics.back, 'back-ash');
  assert.equal(equipCosmetic(p, 'back', 'back-gold'), false, 'unowned equip rejected');
});

test('starter deck cards are collectible (not tokens)', () => {
  for (const id of defaultDeck) assert.ok(!cardById[id].token, id);
});
