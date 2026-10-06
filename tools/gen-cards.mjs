// tools/gen-cards.mjs — Eruldin card-pool generator.
// Emits packages/content/pool.mjs: ~300 additional cards across 8 sets,
// with rarity distribution, stat budget math, synergy tags and token cards.
// Run: node tools/gen-cards.mjs
//
// Design model (all numbers documented so balance stays auditable):
//   UNIT STAT BUDGET  B = 2C + 2 points of (atk+hp) for a vanilla unit.
//   KEYWORD COSTS     cabuk 1.0, golge 0.7, ezici 1.0, dayanikli 0.7,
//                     koruyucu 0.5, canavar 1.2, celik 0.5, yanki 1.6.
//   TRIGGER VALUE     cagri/sonNefes/saldiri/turSonu/olustur effects carry
//                     their own mana value — stats shrink to keep B honest.
//   SPELL VALUE       each effect maps to a mana price (table below); the
//                     card's cost = ceil(totalValue * 0.92) so spells sit a
//                     hair under curve (they're situational, units aren't).
//   RARITY MIX        common 55% / rare 28% / epic 13% / legendary 4%.
//                     common = vanilla or 1 keyword, rare = 2 kw or small
//                     trigger, epic = strong trigger/combo, legendary =
//                     hero with stacked signature effect.
//   HERO RULE         kind 'hero' only from epic+; cost >= 4.

import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- seeded RNG (deterministic output, re-runs are stable) ----------
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0xE51226);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const pickN = (arr, n) => {
  const c = arr.slice(); const out = [];
  while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]);
  return out;
};
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---------- mana value tables ----------
const KW_COST = {cabuk: 1.0, golge: 0.7, ezici: 1.0, dayanikli: 0.7, koruyucu: 0.5, canavar: 1.2, celik: 0.5, yanki: 1.6};

function effectValue(e) {
  const n = e.n || 1;
  switch (e.t) {
    case 'damage':
      if (e.target === 'enemy-avatar') return 0.6 * n;
      if (e.target === 'all-enemy-units') return 1.1 * n + 1.0;
      if (e.target === 'all-units') return 0.9 * n;
      if (e.target === 'random-enemy') return 0.7 * n;
      if (e.target === 'strongest-enemy' || e.target === 'weakest-enemy') return 0.9 * n;
      return 0.8 * n; // target-unit
    case 'heal':
      if (e.target === 'self-avatar') return 0.4 * n;
      if (e.target === 'all-friendly-units') return 0.8 * n + 0.5;
      return 0.5 * n;
    case 'buff': {
      const v = 0.6 * ((e.atk || 0) + (e.hp || 0));
      return e.target === 'all-friendly-units' ? v + 1.2 : v + 0.2;
    }
    case 'temp-atk': return 0.45 * (e.atk || 1);
    case 'temp-atk-all': return 0.45 * (e.atk || 1) + 0.6;
    case 'draw': return 1.4 * n;
    case 'draw-tag': return 1.5 * n;
    case 'summon': return 0.8 * n + 0.6; // priced per 1-cost token; overridden for real cards
    case 'corrupt':
      return e.target === 'all-enemy-units' ? 1.5 * n + 0.5 : 0.55 * n;
    case 'cleanse': return e.target === 'all-friendly-units' ? 0.8 : 0.4;
    case 'return': return e.target === 'strongest-enemy' ? 3.0 : 1.9;
    case 'silence': return 1.8;
    case 'stun': return e.target === 'all-enemy-units' ? 3.4 : 1.5;
    case 'revive': return 2.4 * n + 0.5 * Math.max(0, (e.atk || 0) + (e.hp || 0));
    case 'hatira': return 0.55 * n;
    case 'give-kw': return (KW_COST[e.kw] || 0.8) + 0.35;
    case 'mill': return 0.55 * n;
    case 'shield': return 0.42 * n;
    case 'transform': return 1.2; // caller overrides with target card's value
    case 'copy-weak': return 1.2;
    case 'temp-atk-others': return 0.4 * (e.atk || 1);
    default: return 0.5;
  }
}
const effectListValue = list => (list || []).reduce((s, e) => s + effectValue(e), 0);

// ---------- sets (8) ----------
// weight: share of the pool; pairs: synergy partner sets for combo cards
const SETS = [
  {id: 'direnis', bias: ['dayanikli', 'koruyucu', 'canavar'], tags: ['ocak', 'muhafiz'],
   nameAdj: ['Koru', 'Ocak', 'Mantar', 'Sığınak', 'Köprü', 'Altın'], 
   roles: ['Muhafızı', 'Şifacısı', 'Aşçısı', 'Kurucusu', 'Tercümanı', 'Bekçisi', 'Dul Vereni', 'Işık Taşıyıcısı']},
  {id: 'konsey', bias: ['golge', 'cabuk', 'ezici'], tags: ['kizil', 'muhbiri'],
   nameAdj: ['Kızıl', 'Konsey', 'Kale', 'Ferman', 'Sur', 'Kan'], 
   roles: ['Muhbiri', 'Muhafızı', 'Kâtibi', 'Zebellahı', 'Habercisi', 'Vergicisi', 'Celladı', 'Elçisi']},
  {id: 'karah', bias: ['ezici', 'canavar'], tags: ['yozlasma', 'suru'],
   nameAdj: ['Karah', 'Katran', 'Obsidyen', 'Mor', 'Çarpık', 'Siyah'],
   roles: ['Sürüsü', 'Emicisi', 'Yavrusu', 'Filizi', 'Taşıyıcısı', 'Tohumu', 'Kulu', 'Zırhlısı']},
  {id: 'teom', bias: ['celik', 'koruyucu'], tags: ['goz', 'bosluk'],
   nameAdj: ['Teom', 'Göz', 'Beyaz', 'Serlunar', 'Kutsal', 'Manastır'],
   roles: ['Keşişi', 'Bilgini', 'Şövalyesi', 'Gözcüsü', 'Demircisi', 'Yazmanı', 'Muhafızı', 'Vaizi']},
  {id: 'notr', bias: ['cabuk', 'yanki'], tags: ['kul', 'kuzgun'],
   nameAdj: ['Kül', 'Kuzgunyuvası', 'Paslı', 'Tarlalar', 'Gri', 'Toz'],
   roles: ['Gözcüsü', 'Serseri', 'Zebellahı', 'Koleksiyoncusu', 'Zar Atıcısı', 'Hurdacısı', 'Çobanı', 'Hancısı']},
  {id: 'serseri', bias: ['golge', 'cabuk'], tags: ['hirsiz', 'sis'],
   nameAdj: ['Sis', 'Gece', 'Gri Pelerin', 'Kör', 'Fısıltı', 'Yankısız'],
   roles: ['Hırsızı', 'Sokması', 'Pusucusu', 'Maskelisi', 'Kaçağı', 'Dilsizi', 'Gölgesi', 'Kancalısı']},
  {id: 'av', bias: ['canavar', 'ezici', 'olustur'], tags: ['avci', 'surun'],
   nameAdj: ['Kuzey', 'Kurt', 'Pençe', 'Kanlı', 'Bozkır', 'Boynuz'],
   roles: ['Avcısı', 'Tazısı', 'Sürücüsü', 'İz Sürücüsü', 'Efsanesi', 'Okçusu', 'Kurdu', 'Canavarı']},
  {id: 'ruh', bias: ['yanki', 'turSonu'], tags: ['yankici', 'hatira'],
   nameAdj: ['Yankı', 'Hatıra', 'Unutulmuş', 'Akis', 'Boşluk', 'Sisli'],
   roles: ['Habercisi', 'Koru\'ması', 'Yüzü', 'Sesi', 'Kalıntısı', 'Yankıcısı', 'Andıcı', 'Feneri']},
];

// token card defs used by summon effects (real ids so summon resolves)
const TOKENS = [
  {id: 'tok-karah-yavru',  kind: 'unit', group: 'karah', cost: 1, atk: 1, hp: 1, kw: [], name: {tr: 'Karah Yavrusu', en: 'Karah Spawn'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'karah-yavru.png', token: true, src: '[G]'},
  {id: 'tok-kizil-er',     kind: 'unit', group: 'konsey', cost: 1, atk: 1, hp: 1, kw: [], name: {tr: 'Kızıl Er', en: 'Red Soldier'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'kizil-cizgi.png', token: true, src: '[G]'},
  {id: 'tok-koru-koylu',   kind: 'unit', group: 'direnis', cost: 1, atk: 1, hp: 1, kw: [], name: {tr: 'Koru Köylüsü', en: 'Hearth Villager'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'hearth.png', token: true, src: '[G]'},
  {id: 'tok-av-tazi',      kind: 'unit', group: 'av', cost: 1, atk: 2, hp: 1, kw: [], name: {tr: 'Av Tazısı', en: 'Hunt Hound'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'ash.png', token: true, src: '[G]'},
  {id: 'tok-ruh-aksami',   kind: 'unit', group: 'ruh', cost: 1, atk: 1, hp: 2, kw: ['yanki'], name: {tr: 'Akşam Yankısı', en: 'Evening Echo'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'memory.png', token: true, src: '[G]'},
  {id: 'tok-sis-golge',    kind: 'unit', group: 'serseri', cost: 1, atk: 1, hp: 1, kw: ['golge'], name: {tr: 'Sis Gölgesi', en: 'Mist Shade'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'golge-yolu.png', token: true, src: '[G]'},
  {id: 'tok-teom-noble',   kind: 'unit', group: 'teom', cost: 1, atk: 0, hp: 3, kw: ['koruyucu'], name: {tr: 'Teom Taşı', en: 'Teom Stone'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'teom-blade.png', token: true, src: '[G]'},
  {id: 'tok-suru-kok',     kind: 'unit', group: 'karah', cost: 2, atk: 2, hp: 2, kw: [], name: {tr: 'Sürü Kökü', en: 'Swarm Root'}, text: {tr: '', en: ''}, flavor: {tr: '', en: ''}, art: 'karah.png', token: true, src: '[G]'},
];

// ---------- effect libraries per set ----------
// each entry: {effects, needsTarget?, kw?, text tr/en builder}
const LIB = {
  direnis: [
    {effects: [{t: 'heal', target: 'self-avatar', n: 2}], text: ['Avatarını 2 iyileştir.', 'Heal your avatar 2.']},
    {effects: [{t: 'heal', target: 'all-friendly-units', n: 1}], text: ['Dost birimleri 1 iyileştir.', 'Heal friendly units 1.']},
    {effects: [{t: 'buff', target: 'target-unit', atk: 0, hp: 2}], needsTarget: 'ally-unit', text: ['Bir dost birime +0/+2 ver.', 'Give an ally +0/+2.']},
    {effects: [{t: 'buff', target: 'all-friendly-units', atk: 0, hp: 1}], text: ['Dost birimlere +0/+1.', 'Friendly units get +0/+1.']},
    {effects: [{t: 'shield', n: 2}], text: ['2 Zırh kazan (hasarı avatarından önce emer).', 'Gain 2 Shield.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'dayanikli'}], needsTarget: 'ally-unit', text: ['Dost birime Dayanıklı kazandır.', 'Grant an ally Tough.']},
    {effects: [{t: 'summon', card: 'tok-koru-koylu'}], text: ['Bir Koru Köylüsü çağır.', 'Summon a Hearth Villager.']},
    {effects: [{t: 'heal', target: 'target-unit', n: 3}], needsTarget: 'ally-unit', text: ['Dost birimi 3 iyileştir.', 'Heal an ally 3.']},
    {effects: [{t: 'heal', target: 'self-avatar', n: 1}, {t: 'hatira', n: 1}], text: ['Avatarını 1 iyileştir; 1 Hatıra.', 'Heal avatar 1; 1 Memory.']},
  ],
  konsey: [
    {effects: [{t: 'damage', target: 'enemy-avatar', n: 2}], text: ['Rakip avatara 2 hasar.', 'Deal 2 to the enemy avatar.']},
    {effects: [{t: 'damage', target: 'target-unit', n: 3}], needsTarget: 'enemy-unit', text: ['Bir düşman birimine 3 hasar.', 'Deal 3 to an enemy unit.']},
    {effects: [{t: 'draw', n: 1}], text: ['Kart çek.', 'Draw a card.']},
    {effects: [{t: 'damage', target: 'all-enemy-units', n: 1}], text: ['Düşman birimlere 1 hasar.', 'Deal 1 to enemy units.']},
    {effects: [{t: 'summon', card: 'tok-kizil-er'}], text: ['Bir Kızıl Er çağır.', 'Summon a Red Soldier.']},
    {effects: [{t: 'damage', target: 'strongest-enemy', n: 2}], text: ['En güçlü düşmana 2 hasar.', 'Deal 2 to the strongest enemy.']},
    {effects: [{t: 'temp-atk', target: 'target-unit', atk: 2}], needsTarget: 'ally-unit', text: ['Dost birime bu tur +2 güç.', 'Ally gets +2 power this round.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'golge'}], needsTarget: 'ally-unit', text: ['Dost birime Gölge kazandır.', 'Grant an ally Shadow.']},
    {effects: [{t: 'stun', target: 'target-unit'}], needsTarget: 'enemy-unit', text: ['Düşman birimi sersemlet (bu tur saldıramaz/savunamaz).', 'Stun an enemy unit.']},
  ],
  karah: [
    {effects: [{t: 'corrupt', target: 'target-unit', n: 2}], needsTarget: 'enemy-unit', text: ['Düşman birime 2 Yozlaşma.', 'Give an enemy 2 Corruption.']},
    {effects: [{t: 'corrupt', target: 'all-enemy-units', n: 1}], text: ['Düşman birimlere 1 Yozlaşma.', 'Enemy units gain 1 Corruption.']},
    {effects: [{t: 'summon', card: 'tok-karah-yavru'}], text: ['Karah Yavrusu çağır.', 'Summon a Karah Spawn.']},
    {effects: [{t: 'summon', card: 'tok-karah-yavru', n: 2}], text: ['İki Karah Yavrusu çağır.', 'Summon two Karah Spawn.']},
    {effects: [{t: 'summon', card: 'tok-suru-kok'}], text: ['Sürü Kökü çağır.', 'Summon a Swarm Root.']},
    {effects: [{t: 'damage', target: 'all-units', n: 1}], text: ['Tüm birimlere 1 hasar.', 'Deal 1 to all units.']},
    {effects: [{t: 'damage', target: 'target-unit', n: 2}, {t: 'corrupt', target: 'target-unit', n: 1}], needsTarget: 'enemy-unit', text: ['Düşman birime 2 hasar + 1 Yozlaşma.', 'Deal 2 to an enemy and give 1 Corruption.']},
    {effects: [{t: 'buff', target: 'target-unit', atk: 2, hp: -1}], needsTarget: 'ally-unit', text: ['Dost birime +2/-1.', 'Ally gets +2/-1.']},
    {effects: [{t: 'heal', target: 'self-avatar', n: 1}, {t: 'corrupt', target: 'weakest-enemy', n: 2}], text: ['Avatarını 1 iyileştir; en zayıf düşmana 2 Yozlaşma.', 'Heal avatar 1; weakest enemy gets 2 Corruption.']},
  ],
  teom: [
    {effects: [{t: 'cleanse', target: 'all-friendly-units'}], text: ['Dost birimlerin Yozlaşmasını temizle.', 'Cleanse friendly units.']},
    {effects: [{t: 'return', target: 'target-unit'}], needsTarget: 'enemy-unit', text: ['Düşman birimi sahibinin eline döndür.', 'Return an enemy to hand.']},
    {effects: [{t: 'silence', target: 'target-unit'}], needsTarget: 'any-unit', text: ['Bir birimi sustur.', 'Silence a unit.']},
    {effects: [{t: 'revive', n: 1, atk: -1, hp: -1}], text: ['Son düşen dostu zayıf dirilt.', 'Revive last ally at -1/-1.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'celik'}], needsTarget: 'ally-unit', text: ['Dost birime Teom Çeliği.', 'Grant an ally Teomsteel.']},
    {effects: [{t: 'summon', card: 'tok-teom-noble'}], text: ['Teom Taşı çağır.', 'Summon a Teom Stone.']},
    {effects: [{t: 'stun', target: 'strongest-enemy'}], text: ['En güçlü düşmanı sersemlet.', 'Stun the strongest enemy.']},
    {effects: [{t: 'transform', card: 'tok-teom-noble'}], needsTarget: 'any-unit', transform: true, text: ['Bir birimi Teom Taşına dönüştür.', 'Transform a unit into a Teom Stone.']},
    {effects: [{t: 'draw-tag', group: 'teom', n: 1}], text: ['Teom kartı çek.', 'Draw a Teom card.']},
  ],
  notr: [
    {effects: [{t: 'hatira', n: 2}], text: ['2 Hatıra kazan.', 'Gain 2 Memory.']},
    {effects: [{t: 'draw', n: 1}, {t: 'hatira', n: 1}], text: ['Kart çek; 1 Hatıra.', 'Draw; 1 Memory.']},
    {effects: [{t: 'temp-atk', target: 'target-unit', atk: 1}, {t: 'heal', target: 'target-unit', n: 1}], needsTarget: 'ally-unit', text: ['Dost birime +1 güç bu tur ve 1 iyileşme.', 'Ally +1 power this round and heal 1.']},
    {effects: [{t: 'summon', card: 'tok-ruh-aksami'}], text: ['Akşam Yankısı çağır.', 'Summon an Evening Echo.']},
    {effects: [{t: 'mill', n: 1}], text: ['Rakip destenin üst kartını at.', 'Mill foe\'s top card.']},
    {effects: [{t: 'damage', target: 'random-enemy', n: 1}, {t: 'draw', n: 1}], text: ['Rastgele düşmana 1 hasar; kart çek.', '1 damage to random enemy; draw.']},
  ],
  serseri: [
    {effects: [{t: 'mill', n: 2}], text: ['Rakibin 2 kartını at.', 'Mill foe 2 cards.']},
    {effects: [{t: 'stun', target: 'target-unit'}], needsTarget: 'enemy-unit', text: ['Düşmanı sersemlet.', 'Stun an enemy.']},
    {effects: [{t: 'return', target: 'target-unit'}], needsTarget: 'any-unit', text: ['Bir birimi eline döndür.', 'Return a unit to hand.']},
    {effects: [{t: 'summon', card: 'tok-sis-golge'}], text: ['Sis Gölgesi çağır.', 'Summon a Mist Shade.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'golge'}], needsTarget: 'ally-unit', text: ['Dost birime Gölge.', 'Grant ally Shadow.']},
    {effects: [{t: 'damage', target: 'weakest-enemy', n: 2}], text: ['En zayıf düşmana 2 hasar.', 'Deal 2 to weakest enemy.']},
    {effects: [{t: 'mill', n: 1}, {t: 'draw', n: 1}], text: ['Rakip 1 kart atar; sen çek.', 'Foe mills 1; you draw.']},
    {effects: [{t: 'stun', target: 'weakest-enemy'}, {t: 'damage', target: 'weakest-enemy', n: 1}], text: ['En zayıf düşmanı sersemlet ve 1 hasar.', 'Stun and deal 1 to weakest enemy.']},
  ],
  av: [
    {effects: [{t: 'summon', card: 'tok-av-tazi'}], text: ['Av Tazısı çağır.', 'Summon a Hunt Hound.']},
    {effects: [{t: 'summon', card: 'tok-av-tazi', n: 2}], text: ['İki Av Tazısı çağır.', 'Summon two Hunt Hounds.']},
    {effects: [{t: 'temp-atk-all', atk: 1}], text: ['Dost birimler bu tur +1 güç.', 'Friendly units +1 power this round.']},
    {effects: [{t: 'buff', target: 'all-friendly-units', atk: 1, hp: 0}], text: ['Dost birimlere +1 güç (kalıcı).', 'Friendly units +1 power.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'canavar'}], needsTarget: 'ally-unit', text: ['Dost birime Sömürü.', 'Grant ally Siphon.']},
    {effects: [{t: 'damage', target: 'random-enemy', n: 2}], text: ['Rastgele düşmana 2 hasar.', 'Deal 2 to a random enemy.']},
    {effects: [{t: 'buff', target: 'target-unit', atk: 2, hp: 1}], needsTarget: 'ally-unit', text: ['Dost birime +2/+1.', 'Ally gets +2/+1.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'ezici'}], needsTarget: 'ally-unit', text: ['Dost birime Ezici.', 'Grant ally Crushing.']},
  ],
  ruh: [
    {effects: [{t: 'hatira', n: 3}], text: ['3 Hatıra kazan.', 'Gain 3 Memory.']},
    {effects: [{t: 'revive', n: 1}], text: ['Son düşen dostu dirilt.', 'Revive last fallen ally.']},
    {effects: [{t: 'copy-weak'}], needsTarget: 'any-unit', text: ['Bir birimin zayıf yankısını ele al.', 'Take a weak echo of a unit.']},
    {effects: [{t: 'summon', card: 'tok-ruh-aksami', n: 2}], text: ['İki Akşam Yankısı çağır.', 'Summon two Evening Echoes.']},
    {effects: [{t: 'draw-tag', group: 'ruh', n: 1}], text: ['Ruh kartı çek.', 'Draw a Ruh card.']},
    {effects: [{t: 'heal', target: 'all-friendly-units', n: 1}, {t: 'hatira', n: 1}], text: ['Dostlar 1 iyileşir; 1 Hatıra.', 'Heal allies 1; 1 Memory.']},
    {effects: [{t: 'return', target: 'target-unit'}], needsTarget: 'ally-unit', text: ['Dost birimi ele döndür (yeniden oynanabilir).', 'Return an ally to hand.']},
    {effects: [{t: 'give-kw', target: 'target-unit', kw: 'yanki'}], needsTarget: 'ally-unit', text: ['Dost birime Yankı.', 'Grant ally Echo.']},
  ],
};

// hero (legendary) signature effects per set — bigger, hand-flavored
const HERO_SIG = {
  direnis: [
    [{t: 'shield', n: 4}, {t: 'heal', target: 'all-friendly-units', n: 2}, {t: 'heal', target: 'self-avatar', n: 2}],
    [{t: 'summon', card: 'tok-koru-koylu', n: 2}, {t: 'buff', target: 'all-friendly-units', atk: 1, hp: 1}],
  ],
  konsey: [
    [{t: 'damage', target: 'all-enemy-units', n: 2}, {t: 'draw', n: 1}],
    [{t: 'stun', target: 'strongest-enemy'}, {t: 'damage', target: 'enemy-avatar', n: 3}],
  ],
  karah: [
    [{t: 'corrupt', target: 'all-enemy-units', n: 2}, {t: 'summon', card: 'tok-suru-kok'}],
    [{t: 'damage', target: 'all-units', n: 2}, {t: 'summon', card: 'tok-karah-yavru', n: 2}],
  ],
  teom: [
    [{t: 'return', target: 'strongest-enemy'}, {t: 'cleanse', target: 'all-friendly-units'}],
    [{t: 'stun', target: 'all-enemy-units'}, {t: 'draw', n: 1}],
  ],
  notr: [
    [{t: 'hatira', n: 4}, {t: 'draw', n: 1}],
    [{t: 'summon', card: 'tok-ruh-aksami', n: 2}, {t: 'temp-atk-all', atk: 2}],
  ],
  serseri: [
    [{t: 'mill', n: 4}, {t: 'stun', target: 'weakest-enemy'}],
    [{t: 'return', target: 'target-unit'}, {t: 'summon', card: 'tok-sis-golge', n: 2}],
  ],
  av: [
    [{t: 'summon', card: 'tok-av-tazi', n: 2}, {t: 'temp-atk-all', atk: 2}],
    [{t: 'buff', target: 'all-friendly-units', atk: 2, hp: 0}, {t: 'draw', n: 1}],
  ],
  ruh: [
    [{t: 'revive', n: 2}, {t: 'hatira', n: 2}],
    [{t: 'summon', card: 'tok-ruh-aksami', n: 2}, {t: 'heal', target: 'self-avatar', n: 4}],
  ],
};

// unit trigger blueprints (rarity-gated)
const TRIGGERS = {
  cagri: setId => ({kw: 'cagri', field: 'cagri', pick: () => LIB[setId]}),
  sonNefes: setId => ({kw: 'sonNefes', field: 'sonNefes', pick: () => LIB[setId]}),
};

// ---------- name generation ----------
const usedNames = new Set();
function makeName(set, rarity, kind) {
  for (let tries = 0; tries < 40; tries++) {
    const adj = pick(set.nameAdj), role = pick(set.roles);
    let tr;
    if (kind === 'spell') {
      const forms = [`${adj} Büyüsü`, `${adj} Ritüeli`, `${adj} Yemini`, `${adj} Fısıltısı`, `${adj} Bedeli`, `${adj} Anlaşması`];
      tr = pick(forms);
    } else {
      tr = `${adj} ${role}`;
    }
    if (!usedNames.has(tr)) { usedNames.add(tr); return tr; }
  }
  return `${pick(set.nameAdj)} ${pick(set.roles)} ${int(2, 99)}`; // unique fallback
}

// ---------- card builders ----------
const pool = [];
const byId = new Set(TOKENS.map(t => t.id));
let seq = 0;
function mkId(setId, slug) {
  let id = `g-${setId}-${slug}`;
  while (byId.has(id)) id += 'x';
  byId.add(id);
  return id;
}

function unitBudgetFor(cost) { return 2 * cost + 2; }

function buildUnit(set, rarity, costBias) {
  // pick cost from distribution: heavy on 1-4
  const costTable = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 7];
  let cost = costBias ?? pick(costTable);
  const budget = unitBudgetFor(cost);

  // choose keywords by rarity
  let kwPool = set.bias.filter(k => k !== 'olustur' && k !== 'turSonu');
  let kwCount = rarity === 'common' ? (rnd() < 0.45 ? 1 : 0)
    : rarity === 'rare' ? (rnd() < 0.6 ? 1 : 2)
    : rarity === 'epic' ? 2 : 2;
  const kw = pickN(kwPool, Math.min(kwCount, kwPool.length));
  let spentKw = kw.reduce((s, k) => s + (KW_COST[k] || 0.8), 0);

  // triggers
  const card = {kind: 'unit', kw: [], tags: [...set.tags]};
  let triggerVal = 0;
  if (rarity !== 'common' && rnd() < (rarity === 'rare' ? 0.5 : 0.85)) {
    const trig = rnd() < 0.55 ? 'cagri' : (rnd() < 0.5 ? 'sonNefes' : (rnd() < 0.5 ? 'saldiri' : 'olustur'));
    // only Çağrı can carry a chosen target — other triggers fire without one
    const lib = trig === 'cagri' ? LIB[set.id] : LIB[set.id].filter(e => !e.needsTarget);
    const entry = pick(lib);
    // transform/summon trigger on units: only cagri carries summon; sonNefes fine with summon too
    card[trig] = entry.effects;
    if (entry.needsTarget) card.needsTarget = entry.needsTarget;
    if (trig === 'saldiri') card.kw.push('saldiri');
    else if (trig === 'olustur') card.kw.push('olustur');
    else card.kw.push(trig === 'sonNefes' ? 'sonNefes' : 'cagri');
    triggerVal = effectListValue(entry.effects) * 0.8; // triggers are conditional — discount
  }

  // turSonu keyword appears as set bias on ruh
  if (rarity !== 'common' && set.id === 'ruh' && rnd() < 0.4 && !card.cagri) {
    card.turSonu = pick(LIB.ruh).effects;
    card.kw.push('turSonu');
    triggerVal += effectListValue(card.turSonu) * 0.7;
  }

  card.kw.push(...kw);
  const statBudget = Math.max(2, Math.round(budget - spentKw - triggerVal));
  // split stats — bias atk slightly
  let atk = Math.min(Math.max(1, Math.round(statBudget * (0.42 + rnd() * 0.16))), statBudget - 1);
  let hp = statBudget - atk;
  if (hp < 1) { hp = 1; atk = statBudget - 1; }
  // legendary heroes keep hero kind; rare/epic big stats ok
  Object.assign(card, {cost, atk, hp});
  return card;
}

function buildSpell(set, rarity) {
  const entry = pick(LIB[set.id]);
  const card = {kind: 'spell', speed: 'yavas', tags: [...set.tags], effects: entry.effects};
  if (entry.needsTarget) card.needsTarget = entry.needsTarget;
  // speed: ani costs +~0.5, hizli +~0.25 — reflected by keeping cost but granting speed by rarity
  const v = effectListValue(entry.effects);
  let cost = Math.max(1, Math.ceil(v * 0.92));
  card.cost = Math.min(9, cost);
  if (rarity === 'common') card.speed = 'yavas';
  else if (rarity === 'rare') card.speed = rnd() < 0.5 ? 'hizli' : 'yavas';
  else card.speed = rnd() < 0.6 ? 'ani' : 'hizli';
  return card;
}

function buildHero(set, legendary, existing) {
  // legendary hero: bigger stat budget + signature cagri + 2 kw
  const cost = int(4, 8);
  const sig = pick(HERO_SIG[set.id]);
  const card = {
    kind: 'hero', cost,
    kw: [...pickN(set.bias.filter(k => KW_COST[k] !== undefined), 2), 'cagri'],
    cagri: sig,
    tags: [...set.tags, 'hero'],
  };
  const sigVal = effectListValue(sig) * 0.8;
  const statBudget = Math.max(4, Math.round(unitBudgetFor(cost) - sigVal - 1.5));
  let atk = Math.min(Math.max(2, Math.round(statBudget * 0.48)), statBudget - 1);
  card.atk = atk; card.hp = statBudget - atk;
  return card;
}

// ---------- generate ----------
const TOTAL = 312; // target pool size (≈ 39 per set)
const perSet = Math.floor(TOTAL / SETS.length);
const rarityRoll = () => {
  const r = rnd();
  return r < 0.55 ? 'common' : r < 0.83 ? 'rare' : r < 0.96 ? 'epic' : 'legendary';
};

for (const set of SETS) {
  let legendaries = 0;
  for (let i = 0; i < perSet; i++) {
    let rarity = rarityRoll();
    const isSpell = rnd() < 0.36;
    let card;
    if (rarity === 'legendary') {
      if (isSpell || legendaries >= 4) rarity = 'epic';
      else { legendaries++; card = buildHero(set, true); }
    }
    if (!card) card = isSpell ? buildSpell(set, rarity) : buildUnit(set, rarity);

    const name = makeName(set, rarity, card.kind);
    const slugBase = name.toLowerCase()
      .replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g').replace(/[ıI]/g, 'i')
      .replace(/[öÖ]/g, 'o').replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    card.id = mkId(set.id, `${slugBase}-${seq++}`);
    card.name = {tr: name, en: name};
    // text from the first effect entry's builder when present
    const srcEntry = card.cagri ? LIB[set.id].find(e => JSON.stringify(e.effects) === JSON.stringify(card.cagri))
      : LIB[set.id].find(e => JSON.stringify(e.effects) === JSON.stringify(card.effects || card.sonNefes || card.saldiri || card.olustur));
    card.text = {tr: srcEntry ? srcEntry.text[0] : '', en: srcEntry ? srcEntry.text[1] : ''};
    card.flavor = {tr: '', en: ''};
    card.rarity = rarity;
    card.group = set.id;
    card.art = `gen/${set.id}-${int(1, 2)}.png`;
    card.src = '[G]';
    pool.push(card);
  }
}

// stats report
const stats = {total: pool.length + TOKENS.length, cards: pool.length, tokens: TOKENS.length, byRarity: {}, bySet: {}, byKind: {}};
for (const c of pool) {
  stats.byRarity[c.rarity] = (stats.byRarity[c.rarity] || 0) + 1;
  stats.bySet[c.group] = (stats.bySet[c.group] || 0) + 1;
  stats.byKind[c.kind] = (stats.byKind[c.kind] || 0) + 1;
}
console.log(JSON.stringify(stats, null, 2));

// emit pool.mjs
const header = `// GENERATED by tools/gen-cards.mjs — do not edit by hand.
// ${pool.length} cards + ${TOKENS.length} tokens. Stat model: unit atk+hp = 2*cost+2
// minus keyword/trigger mana values; spells priced by effect table.
// src '[G]' marks generated (non-canon-name) cards.
export const POOL_TOKENS = ${JSON.stringify(TOKENS, null, 2)};
export const POOL = `;
const body = JSON.stringify(pool, null, 2)
  .replace(/"([a-zA-Z_$][\w$]*)":/g, '$1:');
writeFileSync(join(ROOT, 'packages/content/pool.mjs'), header + body + ';\n', 'utf8');
console.log('wrote packages/content/pool.mjs');
