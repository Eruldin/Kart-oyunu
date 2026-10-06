// tools/gen-campaign.mjs — 60-chapter campaign generator.
// Emits packages/content/campaign.mjs: CAMPAIGN (chapters 5..59 — the first
// 5 chapters are hand-authored canon) plus generated enemy decks.
// Run: node tools/gen-campaign.mjs
//
// Structure per 20-chapter act:
//   nodes %10==9 (10,20,...,60): BOSS   — stacked mutators + legendaries
//   nodes %10==7 ( 8,18,...,58): TFT    — grid auto-battle boss (task #21)
//   nodes %10==4 ( 5,15,...,55): ELITE  — single mutator buff
//   else NORMAL
// Difficulty: health 16 + floor(i*0.35) + boss bonus; tier gates which
// rarities appear in enemy decks (T1 common+rare, T2 +epic, T3 +legendary).

import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {POOL, POOL_TOKENS} from '../packages/content/pool.mjs';
import {CARDS} from '../packages/content/cards.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// canon pool used by enemies (exclude tokens)
const ALL = [...CARDS.filter(c => !c.token), ...POOL.filter(c => !c.token)];
const byId = Object.fromEntries(ALL.map(c => [c.id, c]));

// ---------- archetypes ----------
const ARCH = {
  karah:  {group: 'karah',  allies: ['notr'],    opp: ['Karah Öncüsü', 'Sürü Kulu', 'Yozlaşma Taşıyıcısı', 'Mor Sürü']},
  konsey: {group: 'konsey', allies: ['serseri'], opp: ['Konsey Zaptiyesi', 'Kızıl Muhafız', 'Sur Komutanı', 'Emir Muhafızı']},
  direnis:{group: 'direnis',allies: ['teom'],    opp: ['Koru Muhafızları', 'Ocak Devriyeleri', 'Sığınak Birliği', 'Koru Yeminlileri']},
  teom:   {group: 'teom',   allies: ['ruh'],     opp: ['Göz\'ün Keşişleri', 'Manastır Devriyesi', 'Teom Yargıcı', 'Beyaz Vaizler']},
  serseri:{group: 'serseri',allies: ['konsey'],  opp: ['Sis Çetesi', 'Gölge Pusu', 'Kör Sokak Çetesi', 'Maskeli Olanlar']},
  av:     {group: 'av',     allies: ['notr'],    opp: ['Bozkır Sürüsü', 'Avcı Birliği', 'Pençe Sürüsü', 'Kurt Sürüsü']},
  ruh:    {group: 'ruh',    allies: ['teom'],    opp: ['Yankı Ağıtçıları', 'Hatıra Korucuları', 'Boşluk Fenerleri', 'Akis Sürüsü']},
  notr:   {group: 'notr',   allies: ['av'],      opp: ['Kül Serserileri', 'Tarla Haydutları', 'Kuzgunyuvası Çetesi', 'Kül Çobanları']},
};

const ACTS = [
  {name: {tr: 'I. Perde — Kül ve Koru', en: 'Act I — Ash and Hearth'}, archs: ['karah', 'notr', 'konsey', 'av'],
   intro: {tr: 'Korvengrad\'ın külleri üstünde ilerliyorsun. {opp} yolu kesiyor.', en: 'You advance over Korvengrad\'s ashes. {opp} blocks the road.'}},
  {name: {tr: 'II. Perde — Kızıl Hat', en: 'Act II — The Red Line'}, archs: ['konsey', 'serseri', 'direnis', 'teom'],
   intro: {tr: 'Konsey topraklarındasın. {opp} seni bekliyordu.', en: 'You are in Council territory. {opp} was expecting you.'}},
  {name: {tr: 'III. Perde — Karah Yurdu', en: 'Act III — Karah Homeland'}, archs: ['karah', 'ruh', 'serseri', 'teom'],
   intro: {tr: 'Mor damarlar taşların arasında atıyor. {opp} son direnişini kurdu.', en: 'Violet veins pulse in the stone. {opp} has made its last stand.'}},
];

const BOSSES = [
  {id: 9,  name: {tr: 'Kırk Diş\'in Kapıcısı', en: 'Gatekeeper of Forty Teeth'}, opp: 'Kapıcı Karga', arch: 'konsey',
   mut: {hpBonus: 6, shield: 3}, intro: {tr: 'Kalenin gölgesinde bekleyen şey adını sordu. Cevap vermedin.', en: 'The thing in the castle\'s shadow asked your name. You didn\'t answer.'}},
  {id: 19, name: {tr: 'Sürü Kraliçesi', en: 'Swarm Queen'}, opp: 'Karah Kraliçesi', arch: 'karah',
   mut: {hpBonus: 10, kwAll: ['canavar']}, intro: {tr: 'Yavrular onun kanını taşıyor — hepsi aynı ağızdan konuşuyor.', en: 'The spawn carry her blood — all speak with her mouth.'}},
  {id: 29, name: {tr: 'Sis Baronu', en: 'Baron of Mist'}, opp: 'Sis Baronu', arch: 'serseri',
   mut: {hpBonus: 12, kwAll: ['golge']}, intro: {tr: 'Siste adım sesi yok; borç sesi var. Borcunu istemeye geldi.', en: 'In the mist there are no footsteps — only debts. He came to collect.'}},
  {id: 39, name: {tr: 'Teom İnkarı', en: 'The Teom Denial'}, opp: 'İnkar Şövalyesi', arch: 'teom',
   mut: {hpBonus: 14, kwAll: ['celik'], shield: 4}, intro: {tr: 'Çelik kanmadan konuşamaz; o konuşmadan duramaz.', en: 'Steel cannot speak unanswered; he cannot stand silent.'}},
  {id: 49, name: {tr: 'Yankı Düğümü', en: 'Echo Knot'}, opp: 'Düğüm', arch: 'ruh',
   mut: {hpBonus: 16, kwAll: ['yanki'], hatira: 6}, intro: {tr: 'Burada ölümler geri alınıyor — ama bedeli artıyor.', en: 'Here deaths are unmade — but the price grows.'}},
  {id: 59, name: {tr: 'Karah Kalbi', en: 'The Karah Heart'}, opp: 'Karah Kalbi', arch: 'karah',
   mut: {hpBonus: 24, kwAll: ['ezici', 'canavar'], shield: 6, ozStart: 2}, intro: {tr: 'Yozlaşmanın attığı yer. Kalbi susturursan destan da susar.', en: 'Where corruption beats. Silence the heart and the saga goes quiet too.'}},
];
const ELITES = [
  {mut: {shield: 3}, note: {tr: 'Sertleşmiş bir müfreze bekliyor.', en: 'A hardened squad waits.'}},
  {mut: {kwAll: ['cabuk']}, note: {tr: 'Hepsi tetikte — ilk onlar vuracak.', en: 'All of them are poised — they will strike first.'}},
  {mut: {hatira: 4}, note: {tr: 'Rakip savaşa nihai yeteneği dolu başlıyor.', en: 'The foe begins with its ultimate charged.'}},
  {mut: {ozStart: 2}, note: {tr: 'Rakip ilk turdan güçlü açılıyor.', en: 'The foe opens strong from round one.'}},
  {mut: {kwAll: ['koruyucu']}, note: {tr: 'Duvar gibi dizilmişler — önüne geçemezsin.', en: 'A wall of shields — you cannot slip past.'}},
  {mut: {kwAll: ['ezici']}, note: {tr: 'Her biri dev — savunmayı aşıyorlar.', en: 'Each one a giant — they roll over blockers.'}},
];

// ---------- enemy deck builder ----------
function buildDeck(rnd, archKey, tier, bossy) {
  const arch = ARCH[archKey];
  const allow = c => {
    if (c.rarity === 'legendary') return tier >= 3;
    if (c.rarity === 'epic') return tier >= 2;
    return true;
  };
  const inArch = c => c.group === arch.group;
  const inAlly = c => arch.allies.includes(c.group);
  const isUnit = c => c.kind !== 'spell';
  const main = ALL.filter(c => inArch(c) && allow(c));
  const ally = ALL.filter(c => inAlly(c) && allow(c));
  const deck = [];
  const count = {};
  const push = (c) => {
    const max = c.rarity === 'legendary' ? 1 : c.rarity === 'epic' ? 2 : 3;
    if ((count[c.id] || 0) >= max) return false;
    count[c.id] = (count[c.id] || 0) + 1;
    deck.push(c.id);
    return true;
  };
  const draw = (poolArr, wUnit = 0.62) => {
    const units = poolArr.filter(isUnit);
    const spells = poolArr.filter(c => c.kind === 'spell');
    const arr = rnd() < wUnit ? units : spells;
    if (!arr.length) return;
    // prefer cheaper cards early, more epics at higher tiers
    let c = arr[Math.floor(rnd() * arr.length)];
    if (tier >= 2 && rnd() < 0.18) {
      const epics = arr.filter(x => x.rarity === 'epic' || (tier >= 3 && x.rarity === 'legendary'));
      if (epics.length) c = epics[Math.floor(rnd() * epics.length)];
    }
    push(c);
  };
  // 60% main group, 30% ally, 10% splash from anything cheap
  while (deck.length < 20) {
    const r = rnd();
    if (r < 0.6) draw(main);
    else if (r < 0.9) draw(ally);
    else draw(ALL.filter(c => c.cost <= 3 && allow(c)));
    if (deck.length === 0) break;
    if (Object.keys(count).length >= poolTotalSafe(ALL, allow) - 2) break; // degenerate guard
  }
  // boss decks: inject signature hero when tier allows
  if (bossy) {
    const heroes = main.filter(c => c.kind === 'hero' || c.rarity === 'legendary');
    if (heroes.length && deck.length < 22) push(heroes[Math.floor(rnd() * heroes.length)]);
  }
  return deck;
}
function poolTotalSafe(all, allow) { return all.filter(allow).length; }

// ---------- generate ----------
const campaign = [];
const seenArchIdx = {};
for (let i = 5; i < 60; i++) {
  const act = Math.floor(i / 20); // 0,1,2
  const node = (i + 1) % 10;
  const boss = BOSSES.find(b => b.id === i);
  const type = boss ? 'boss' : node === 7 ? 'tft' : node === 4 ? 'elite' : 'normal';
  const tier = act + 1;
  const health = 16 + Math.floor(i * 0.35) + (boss ? boss.mut.hpBonus : 0);
  const seed = 1000 + i * 137;
  const rnd = mulberry32(seed);

  const archKey = boss ? boss.arch : ACTS[act].archs[i % ACTS[act].archs.length];
  const arch = ARCH[archKey];
  seenArchIdx[archKey] = (seenArchIdx[archKey] || 0);
  const oppName = boss ? boss.opp : arch.opp[seenArchIdx[archKey]++ % arch.opp.length];

  const mutators = [{}, {}]; // [player, enemy]
  if (boss) mutators[1] = {...boss.mut};
  else if (type === 'elite') mutators[1] = {...ELITES[(i / 4 | 0) % ELITES.length].mut};
  else if (act === 2 && type === 'normal' && i % 3 === 0) mutators[1] = {shield: 2};

  const placeNames = {
    0: ['Küllü Yol', 'Sarnıç Mezarlığı', 'Ray Üstü', 'Koru Eşiği', 'Kül Pınarı', 'Bekçi Tepesi', 'Kor Bahçesi', 'Kıraç Geçit'],
    1: ['Kızıl Sur', 'Ferman Meydanı', 'Kırk Diş Avlusu', 'Sis Sokağı', 'Tuz Pazarı', 'Demir Kapı', 'Hat Üstü', 'Mahkum Yolu'],
    2: ['Mor Damar Geçidi', 'Obsidyen Çukur', 'Yankı Vadisi', 'Son Sur', 'Karah Vadisi', 'Zehirli Basamak', 'Kök Dehliz', 'Gece Kapısı'],
  };
  const nm = placeNames[act][i % placeNames[act].length];
  const place = boss ? boss.name : {tr: nm, en: nm};

  campaign.push({
    id: i, seed, health, tier, type,
    act: act + 1,
    echo: boss ? (archKey === 'ruh' ? 'white' : 'teom') : (i % 3 === 0 ? 'teom' : i % 3 === 1 ? 'ash' : 'white'),
    deck: buildDeck(rnd, archKey, tier, !!boss),
    mutators,
    name: boss ? boss.name : place,
    opponent: oppName,
    intro: boss ? boss.intro : (type === 'elite' ? ELITES[(i / 4 | 0) % ELITES.length].note : ACTS[act].intro),
    reward: {shards: 8 + tier * 4 + (type === 'boss' ? 40 : type === 'elite' ? 14 : type === 'tft' ? 20 : 0)},
    src: '[G]',
  });
}

// stats
const counts = {boss: 0, tft: 0, elite: 0, normal: 0};
for (const c of campaign) counts[c.type]++;
console.log(JSON.stringify({chapters: campaign.length, ...counts}, null, 2));

const out = `// GENERATED by tools/gen-campaign.mjs — chapters 5..59 (first 5 are canon).
// Node types: boss (10,20,...,60), tft grid bosses (8,18,...,58),
// elite (%10==4), normal. mutators[1] is the enemy's battle modifier.
export const CAMPAIGN = ${JSON.stringify(campaign, null, 2).replace(/"([a-zA-Z_$][\w$]*)":/g, '$1:')};
`;
writeFileSync(join(ROOT, 'packages/content/campaign.mjs'), out, 'utf8');
console.log('wrote packages/content/campaign.mjs');
