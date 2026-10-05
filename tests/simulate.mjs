// ERULDIN: YANKILAR — balance simulator
// Bot-vs-bot matches across echo matchups & chapter decks → reports/balance.json
// Usage: node tests/simulate.mjs [gamesPerMatchup]
import {createMatch, command, botCommand} from '../packages/engine/index.mjs';
import {chapters, defaultDeck, ECHOES, cardById} from '../packages/content/cards.mjs';
import {mkdir, writeFile} from 'node:fs/promises';

const N = Number(process.argv[2] || 60);
const echoes = Object.keys(ECHOES);

function playGame({seed, echoA, echoB, deckA, deckB, hpA = 24, hpB = 24}) {
  let s = createMatch({seed, echo: [echoA, echoB], health: [hpA, hpB], decks: [deckA, deckB], first: seed % 2});
  let steps = 0;
  while (s.winner === null && steps++ < 4000) {
    const actor = s.phase === 'block' ? 1 - s.token : s.active;
    s = command(s, actor, botCommand(s, actor));
  }
  const c = {A: s.players[0], B: s.players[1]};
  return {
    winner: s.winner, round: s.round, steps, timeout: s.winner === null,
    hp: [c.A.avatar.hp, c.B.avatar.hp],
    dmg: [c.A.stats.dmgDealt, c.B.stats.dmgDealt],
    spells: [c.A.stats.spells, c.B.stats.spells],
    played: [c.A.stats.played, c.B.stats.played],
    ult: [c.A.avatar.ultUsed, c.B.avatar.ultUsed],
  };
}

const report = {generated: new Date().toISOString(), gamesPerMatchup: N, echoWinrates: {}, cardUsage: {}, chapters: []};

// 1) echo mirror-cross matrix with the starter deck on both sides
const matrix = {};
for (const ea of echoes) for (const eb of echoes) {
  const key = `${ea} vs ${eb}`;
  const g = {wins: 0, losses: 0, draws: 0, rounds: [], timeouts: 0};
  for (let i = 0; i < N; i++) {
    const r = playGame({seed: 1000 + i * 17, echoA: ea, echoB: eb, deckA: defaultDeck, deckB: defaultDeck});
    if (r.timeout) { g.timeouts++; continue; }
    g.rounds.push(r.round);
    if (r.winner === 0) g.wins++; else if (r.winner === 1) g.losses++; else g.draws++;
  }
  const played = g.rounds.length || 1;
  matrix[key] = {
    winrate: +(g.wins / played * 100).toFixed(1),
    draws: g.draws, timeouts: g.timeouts,
    avgRounds: +(g.rounds.reduce((a, b) => a + b, 0) / played).toFixed(1),
  };
}
report.echoWinrates = matrix;

// 2) per-card usage + win contribution (instrument via match log)
const cardWin = {}, cardLoss = {};
for (let i = 0; i < 40; i++) {
  let s = createMatch({seed: 9000 + i * 13, echo: ['ash', 'white'], health: [24, 24], decks: [defaultDeck, chapters[1].deck], first: i % 2});
  let steps = 0;
  while (s.winner === null && steps++ < 4000) {
    const actor = s.phase === 'block' ? 1 - s.token : s.active;
    s = command(s, actor, botCommand(s, actor));
  }
  for (const ev of s.log) {
    if (ev.t === 'play' || ev.t === 'cast' || ev.t === 'cast-fast') {
      const side = ev.a;
      const won = s.winner === side;
      const bag = won ? cardWin : cardLoss;
      bag[ev.card] = (bag[ev.card] || 0) + 1;
    }
  }
}
report.cardUsage = Object.fromEntries(Object.keys(cardById).map(id => {
  const w = cardWin[id] || 0, l = cardLoss[id] || 0;
  return [id, {name: cardById[id].name.tr, played: w + l, winPlays: w, playWinrate: w + l ? +((w / (w + l)) * 100).toFixed(1) : null}];
}));

// 3) chapter difficulty — starter deck & ash echo vs each chapter
for (const ch of chapters) {
  let wins = 0, timeouts = 0, rounds = [];
  for (let i = 0; i < N; i++) {
    const r = playGame({seed: ch.seed * 100 + i, echoA: 'ash', echoB: ch.echo, deckA: defaultDeck, deckB: ch.deck, hpB: ch.health});
    if (r.timeout) { timeouts++; continue; }
    rounds.push(r.round);
    if (r.winner === 0) wins++;
  }
  const played = rounds.length || 1;
  report.chapters.push({
    chapter: ch.id, name: ch.name.tr, boss: ch.opponent, bossHp: ch.health, bossEcho: ch.echo,
    playerWinrate: +(wins / played * 100).toFixed(1), avgRounds: +(rounds.reduce((a, b) => a + b, 0) / played).toFixed(1), timeouts,
  });
}

// verdicts
const issues = [];
for (const [k, v] of Object.entries(matrix)) {
  if (v.winrate > 62 || v.winrate < 38) issues.push(`Echo dengesizliği: ${k} → %${v.winrate}`);
  if (v.timeouts > N * 0.1) issues.push(`Uzayan maçlar: ${k} → ${v.timeouts} zaman aşımı`);
}
for (const ch of report.chapters) {
  if (ch.playerWinrate > 75) issues.push(`Bölüm çok kolay: ${ch.name} → %${ch.playerWinrate}`);
  if (ch.playerWinrate < 35) issues.push(`Bölüm çok zor: ${ch.name} → %${ch.playerWinrate}`);
}
for (const [id, u] of Object.entries(report.cardUsage)) {
  if (u.played > 8 && u.playWinrate > 68) issues.push(`Kart baskın: ${u.name} → %${u.playWinrate} (${u.played} oynanış)`);
  if (u.played > 8 && u.playWinrate < 32) issues.push(`Kart zayıf: ${u.name} → %${u.playWinrate}`);
}
report.issues = issues;

await mkdir('reports', {recursive: true});
await writeFile('reports/balance.json', JSON.stringify(report, null, 2));

// console summary
console.log('=== ECHO MIRROR MATRIX (winrate% | avgRounds) ===');
for (const [k, v] of Object.entries(matrix)) console.log(k.padEnd(16), String(v.winrate).padStart(5) + '%', `~${v.avgRounds} tur`, v.timeouts ? `⏱${v.timeouts}` : '');
console.log('\n=== CHAPTERS (starter ash) ===');
for (const c of report.chapters) console.log(`B${c.chapter} ${c.name}`.padEnd(34), `win %${c.playerWinrate}`, `~${c.avgRounds} tur`);
console.log('\n=== ISSUES ===');
console.log(issues.length ? issues.join('\n') : 'Denge makul aralıkta.');
console.log('\n→ reports/balance.json');
