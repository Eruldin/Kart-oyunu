// ERULDIN: YANKILAR — drop tables, collection, shard economy.
// Deterministic: pass a seed, get the same rewards. Server and the offline
// client call the same pure functions; seeds come from chapter + match id.
//
// Rarity weights per node type (of 100):
//   normal  C70 R22 E6 L2     — everyday nodes trickle commons
//   elite   C40 R35 E18 L7    — elites skew rare+
//   tft     R30 E50 L20       — grid battles award big pieces only
//   boss    R45 E40 L15       — bosses are the legendary hunt
// Boss legendary chance is dynamic: base 15%, +10% per boss kill without a
// legendary (pity counter), guaranteed on the 7th (15+60 ≥ 75% roll). A
// legendary drop resets the counter. Duplicate cards beyond 3 copies
// convert to shards at SHARD_VALUE.

import {COLLECTIBLE, cardById} from './cards.mjs';

export const SHARD_VALUE = {common: 5, rare: 15, epic: 40, legendary: 120};

export const DROP_WEIGHTS = {
  normal: {common: 70, rare: 22, epic: 6,  legendary: 2},
  elite:  {common: 40, rare: 35, epic: 18, legendary: 7},
  tft:    {common: 0,  rare: 30, epic: 50, legendary: 20},
  boss:   {common: 0,  rare: 45, epic: 40, legendary: 15},
};

export const CARDS_PER_TYPE = {normal: 1, elite: 2, tft: 2, boss: 3};
export const PITY_BASE = 0.15;   // boss legendary chance at pity 0
export const PITY_STEP = 0.10;   // +chance per boss without a legendary

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

function pickRarity(weights, rng) {
  let total = 0;
  for (const w of Object.values(weights)) total += w;
  let roll = rng() * total;
  for (const [r, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return r;
  }
  return 'common';
}

function pickCard(rarity, rng) {
  const pool = BY_RARITY[rarity] || BY_RARITY.common;
  return pool[Math.floor(rng() * pool.length)];
}

// Roll rewards for beating a chapter.
//   rollRewards(chapter, {pity, seed}) -> {cards:[ids], shards, legendary:boolean, pity:newPity}
// `shards` = chapter reward.shards + shard value of any overflow (>3 copies
// is resolved later by applyRewards, which knows the collection).
export function rollRewards(ch, {pity = 0, seed = 1} = {}) {
  const rng = mulberry32((seed ^ 0xB055) | 0);   // seed mix, deterministic
  const type = DROP_WEIGHTS[ch.type] ? ch.type : 'normal';
  const w = DROP_WEIGHTS[type];
  const n = CARDS_PER_TYPE[type];
  const cards = [];
  let legendary = false;

  // boss pity: one forced legendary slot when the roll succeeds
  let pityHit = false;
  if (type === 'boss') {
    const chance = PITY_BASE + pity * PITY_STEP;
    if (rng() < Math.min(chance, 1)) pityHit = true;
  }
  for (let i = 0; i < n; i++) {
    const r = pityHit && i === 0 ? 'legendary' : pickRarity(w, rng);
    const id = pickCard(r, rng);
    cards.push(id);
    if (r === 'legendary') legendary = true;
  }
  const newPity = type === 'boss' ? (legendary ? 0 : pity + 1) : pity;
  return {cards, shards: ch.reward?.shards || 0, legendary, pity: newPity};
}

// Apply rewards to a profile {collection:{id:count}, shards, pity}.
// Returns a display record: cards won, shards won (incl. overflow refunds).
export function applyRewards(profile, ch, seed) {
  profile.collection ||= {};
  profile.shards ||= 0;
  const res = rollRewards(ch, {pity: profile.pity || 0, seed});
  const won = [];
  let refund = 0;
  for (const id of res.cards) {
    const n = profile.collection[id] || 0;
    if (n >= 3) {
      refund += SHARD_VALUE[cardById[id]?.rarity || 'common'];
    } else {
      profile.collection[id] = n + 1;
      won.push(id);
    }
  }
  profile.pity = res.pity;
  profile.shards += res.shards + refund;
  return {cards: won, shards: res.shards + refund, legendary: res.legendary, pity: profile.pity};
}

// Starter collection: the default deck at 3 copies each + a seeded sprinke
// of commons so the deck builder has real material from the start.
export function starterCollection(deck, seed = 7) {
  const rng = mulberry32(seed);
  const col = {};
  for (const id of deck) col[id] = Math.min(3, (col[id] || 0) + 1);
  const commons = BY_RARITY.common;
  for (let i = 0; i < 12; i++) {
    const id = commons[Math.floor(rng() * commons.length)];
    if ((col[id] || 0) < 3) col[id] = (col[id] || 0) + 1;
  }
  return col;
}
