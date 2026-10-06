// ERULDIN: YANKILAR — market: card packs + cosmetics, priced in shards (◆).
// buyItem is pure and deterministic (seed = profile.packOpens ^ item id) so
// server and offline client share one implementation.

import {COLLECTIBLE, cardById} from './cards.mjs';
import {SHARD_VALUE} from './drops.mjs';

export const PACKS = {
  'pack-std':   {pulls: 5, weights: {common: 68, rare: 24, epic: 6,  legendary: 2}, guarantee: 'rare'},
  'pack-elite': {pulls: 5, weights: {common: 50, rare: 30, epic: 16, legendary: 4}, guarantee: 'epic'},
};

export const COSMETICS = {
  // slot 'back' — card back hue variants
  'back-red':   {slot: 'back',  price: 80,  hue: 145, name: {tr: 'Kızıl Konsey', en: 'Red Council'}},
  'back-teom':  {slot: 'back',  price: 80,  hue: 175, name: {tr: 'Teom Gözü', en: 'Teom Eye'}},
  'back-gold':  {slot: 'back',  price: 200, hue: 40,  sat: 1.6, name: {tr: 'Altın Yankı', en: 'Golden Echo'}},
  // slot 'board' — battlefield tint veils
  'board-council': {slot: 'board', price: 150, tint: '#8a1420', name: {tr: 'Konsey Meydanı', en: 'Council Square'}},
  'board-karah':   {slot: 'board', price: 150, tint: '#4a1e6e', name: {tr: 'Karah Toprağı', en: 'Karah Soil'}},
  'board-mist':    {slot: 'board', price: 150, tint: '#2b4a5a', name: {tr: 'Sis Boğazı', en: 'Mist Pass'}},
  // slot 'ember' — ambient particle color
  'ember-blood': {slot: 'ember', price: 60,  name: {tr: 'Kan Kıvılcımı', en: 'Blood Ember'}},
  'ember-void':  {slot: 'ember', price: 100, name: {tr: 'Boşluk Alevi', en: 'Void Flame'}},
};

export const SHOP_ITEMS = [
  {id: 'pack-std',   type: 'pack',    price: 60,  name: {tr: 'Set Paketi', en: 'Set Pack'},      desc: {tr: '5 kart — en az 1 Nadir+', en: '5 cards — at least 1 Rare+'}},
  {id: 'pack-elite', type: 'pack',    price: 140, name: {tr: 'Elit Paket', en: 'Elite Pack'},    desc: {tr: '5 kart — en az 1 Destansı+', en: '5 cards — at least 1 Epic+'}},
  ...Object.entries(COSMETICS).map(([id, c]) => ({id, type: 'cosmetic', price: c.price, name: c.name, slot: c.slot})),
];

export const itemById = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BY_RARITY = {};
for (const c of COLLECTIBLE) (BY_RARITY[c.rarity || 'common'] ||= []).push(c.id);
const RANK = {common: 0, rare: 1, epic: 2, legendary: 3};

function pickRarity(weights, rng) {
  let total = 0;
  for (const w of Object.values(weights)) total += w;
  let roll = rng() * total;
  for (const [r, w] of Object.entries(weights)) { roll -= w; if (roll <= 0) return r; }
  return 'common';
}

export function rollPack(packId, seed) {
  const pack = PACKS[packId];
  const rng = mulberry32((seed ^ 0xFACE) | 0);
  const cards = [];
  for (let i = 0; i < pack.pulls; i++) {
    let r = pickRarity(pack.weights, rng);
    if (i === 0 && RANK[r] < RANK[pack.guarantee]) r = pack.guarantee;
    const pool = BY_RARITY[r];
    cards.push(pool[Math.floor(rng() * pool.length)]);
  }
  return cards;
}

export function defaultCosmetics() {
  return {back: 'back-ash', board: 'board-hearth', ember: 'ember', owned: ['back-ash', 'board-hearth', 'ember']};
}

// buyItem(profile, itemId) -> {ok, item, pulls?, refund?, error?}
// Mutates profile: shards, collection, cosmetics, packOpens.
export function buyItem(profile, itemId) {
  const item = itemById[itemId];
  if (!item) return {ok: false, error: 'Öğe bulunamadı.'};
  profile.shards ||= 0;
  profile.collection ||= {};
  profile.cosmetics ||= defaultCosmetics();
  if (item.type === 'cosmetic' && profile.cosmetics.owned.includes(itemId))
    return {ok: false, error: 'Zaten sahipsin.'};
  if (profile.shards < item.price) return {ok: false, error: 'Yeterli Parça yok.'};
  profile.shards -= item.price;
  if (item.type === 'pack') {
    profile.packOpens = (profile.packOpens || 0) + 1;
    const pulls = rollPack(itemId, profile.packOpens * 7919 + profile.shards);
    const fresh = [];
    let refund = 0;
    for (const id of pulls) {
      if ((profile.collection[id] || 0) >= 3) refund += SHARD_VALUE[cardById[id]?.rarity || 'common'];
      else { profile.collection[id] = (profile.collection[id] || 0) + 1; fresh.push(id); }
    }
    profile.shards += refund;
    return {ok: true, item, pulls: fresh, refund};
  }
  const cos = COSMETICS[itemId];
  profile.cosmetics.owned.push(itemId);
  profile.cosmetics[cos.slot] = itemId;
  return {ok: true, item};
}

// equipCosmetic(profile, itemId|null, slot) — switch active cosmetic per slot.
export function equipCosmetic(profile, slot, itemId) {
  profile.cosmetics ||= defaultCosmetics();
  const base = {back: 'back-ash', board: 'board-hearth', ember: 'ember'}[slot];
  if (!profile.cosmetics.owned.includes(itemId)) return false;
  profile.cosmetics[slot] = itemId || base;
  return true;
}
