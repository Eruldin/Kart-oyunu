// Backend bridge: server API when available, else local engine + bot (offline/static).
// Both modes expose the same surface: profile, startStory, startSkirmish, command, events.
import {createMatch, command as engineCommand, botCommand, viewFor} from '../vendor/engine/index.mjs';
import {chapters, defaultDeck, enemyDeck, cardById, ECHOES, CARDS} from '../vendor/content/cards.mjs';
import {applyRewards, starterCollection} from '../vendor/content/drops.mjs';
import {buyItem, equipCosmetic, defaultCosmetics} from '../vendor/content/shop.mjs';

const LS = 'eruldin.local.';
const BOT_DELAY = 750;

function localProfile() {
  let p = JSON.parse(localStorage.getItem(LS + 'profile') || 'null');
  if (!p) {
    p = {id: 'local', name: 'Gezgin', progress: 0, wins: 0, storyWins: 0, deck: [...defaultDeck], echoes: ['ash'],
         collection: starterCollection(defaultDeck), shards: 0, pity: 0, cosmetics: defaultCosmetics()};
    saveLocal(p);
  }
  if (!p.echoes) p.echoes = ['ash'];
  if (!p.collection) { p.collection = starterCollection(p.deck || defaultDeck); p.shards = 0; p.pity = 0; }
  if (!p.cosmetics) p.cosmetics = defaultCosmetics();
  return p;
}
function saveLocal(p) { localStorage.setItem(LS + 'profile', JSON.stringify(p)); }

// ---------------- offline backend ----------------
class LocalBackend {
  constructor() {
    this.mode = 'local';
    this.profile = localProfile();
    this.match = null;
    this.listeners = new Set();
    this.botTimer = null;
  }
  async init() { return {mode: 'local', profile: this.profile}; }
  onEvent(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(payload) { for (const fn of this.listeners) fn(payload); }

  view() { return this.match ? viewFor(this.match.state, 0) : null; }

  async startStory(chapterIdx, echoId) {
    const ch = chapters[chapterIdx];
    if (!ch) throw Error('Bölüm yok.');
    if (chapterIdx > this.profile.progress) throw Error('Bu bölüm henüz açılmadı.');
    this.match = {
      id: 'local-' + Date.now(), kind: 'story', chapter: chapterIdx,
      names: [this.profile.name, ch.opponent],
      state: createMatch({seed: ch.seed ?? (chapterIdx + 1) * 997, echo: [echoId, ch.echo], health: [24, ch.health], decks: [[...this.profile.deck], [...ch.deck]], mutators: ch.mutators}),
    };
    this.scheduleBot();
    return this.pack();
  }
  async startSkirmish(echoId, enemyEchoId, seed = (Math.random() * 1e9) | 0) {
    this.match = {
      id: 'local-' + Date.now(), kind: 'skirmish', chapter: -1,
      names: [this.profile.name, 'Yankı'],
      state: createMatch({seed, echo: [echoId, enemyEchoId], health: [24, 24], decks: [[...this.profile.deck], [...enemyDeck]]}),
    };
    this.scheduleBot();
    return this.pack();
  }
  pack() {
    return {matchId: this.match.id, actor: 0, state: this.view(), names: this.match.names, kind: this.match.kind, chapter: this.match.chapter, profile: this.profile, reward: this.match.reward};
  }
  async command(cmd) {
    if (!this.match) throw Error('Maç yok.');
    this.match.state = engineCommand(this.match.state, 0, cmd);
    this.checkFinish();
    this.scheduleBot();
    return this.pack();
  }
  checkFinish() {
    const s = this.match.state;
    if (s.winner === null || this.match.finished) return;
    this.match.finished = true;
    if (s.winner === 0) {
      this.profile.storyWins++;
      if (this.match.kind === 'story') {
        this.profile.progress = Math.max(this.profile.progress, this.match.chapter + 1);
        // echo unlocks: beat ch2 → white, ch3 → teom
        if (this.match.chapter >= 2 && !this.profile.echoes.includes('white')) this.profile.echoes.push('white');
        if (this.match.chapter >= 3 && !this.profile.echoes.includes('teom')) this.profile.echoes.push('teom');
        const ch = chapters[this.match.chapter];
        const seed = (ch.seed || 1) ^ ((this.profile.storyWins + 1) * 7919);
        this.match.reward = applyRewards(this.profile, ch, seed);
      }
    }
    saveLocal(this.profile);
  }
  scheduleBot() {
    clearTimeout(this.botTimer);
    this.botTimer = setTimeout(() => this.botStep(), BOT_DELAY);
  }
  botStep() {
    const s = this.match?.state;
    if (!s || s.winner !== null) return;
    const botBusy =
      (s.phase === 'mulligan' && !s.players[1].mulliganDone) ||
      (s.phase === 'block' && s.token !== 1) ||
      (s.phase === 'action' && s.active === 1);
    if (!botBusy) return;
    try {
      const cmd = botCommand(s, 1);
      this.match.state = engineCommand(s, 1, cmd);
      this.checkFinish();
      this.emit(this.pack());
      if (this.match.state.winner === null) this.scheduleBot();
    } catch (e) {
      // bot had nothing legal — pass through
      try { this.match.state = engineCommand(s, 1, {type: 'pass'}); this.emit(this.pack()); } catch {}
    }
  }
  async saveDeck(deck) {
    if (!Array.isArray(deck) || deck.length !== 20 || deck.some(id => !cardById[id]) || deck.some(id => deck.filter(x => x === id).length > 3) || deck.some(id => (this.profile.collection?.[id] || 0) < deck.filter(x => x === id).length))
      throw Error('Deste 20 kart içermeli; kartlar koleksiyonunda olmalı; bir kart en fazla 3 kez.');
    this.profile.deck = [...deck]; saveLocal(this.profile);
    return this.profile;
  }
  async setName(name) { this.profile.name = String(name).slice(0, 24) || 'Gezgin'; saveLocal(this.profile); return this.profile; }
  async buy(itemId) {
    const r = buyItem(this.profile, itemId);
    if (!r.ok) throw Error(r.error);
    saveLocal(this.profile);
    return {...r, profile: this.profile};
  }
  async equip(slot, itemId) {
    if (!equipCosmetic(this.profile, slot, itemId)) throw Error('Öğeye sahip değilsin.');
    saveLocal(this.profile);
    return this.profile;
  }
  async tftWin(chapterIdx) {
    const ch = chapters[chapterIdx];
    if (!ch || ch.type !== 'tft') throw Error('Izgara bölümü değil.');
    this.profile.storyWins++;
    this.profile.progress = Math.max(this.profile.progress, chapterIdx + 1);
    const seed = (ch.seed || 1) ^ ((this.profile.storyWins + 1) * 7919) ^ 0x7F7;
    const reward = applyRewards(this.profile, ch, seed);
    saveLocal(this.profile);
    return {reward, profile: this.profile};
  }
}

// ---------------- online backend ----------------
class ServerBackend {
  constructor() { this.mode = 'server'; this.listeners = new Set(); this.token = localStorage.getItem('eruldin.token'); this.es = null; }
  async api(path, data) {
    const r = await fetch('/api/' + path, {
      method: data ? 'POST' : 'GET',
      headers: {'Content-Type': 'application/json', ...(this.token ? {Authorization: 'Bearer ' + this.token} : {})},
      ...(data ? {body: JSON.stringify(data)} : {}),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(out.error || 'Sunucu hatası');
    return out;
  }
  async init() {
    const s = await this.api('session', {token: this.token});
    this.token = s.token; localStorage.setItem('eruldin.token', this.token);
    this.profile = s.profile;
    this.es = new EventSource('/api/events?token=' + encodeURIComponent(this.token));
    this.es.onmessage = e => { const m = JSON.parse(e.data); for (const fn of this.listeners) fn(m); };
    const active = await this.api('match').catch(() => null);
    return {mode: 'server', profile: this.profile, active};
  }
  onEvent(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  async startStory(chapterIdx, echoId) { return this.api('story', {chapter: chapterIdx, echo: echoId}); }
  async command(cmd) { const r = await this.api('command', {matchId: this.match.matchId, command: cmd}); return {state: r.state, profile: r.profile}; }
  async createRoom(echoId) { return this.api('room', {action: 'create', echo: echoId}); }
  async joinRoom(code, echoId) { return this.api('room', {action: 'join', code, echo: echoId}); }
  async cancelRoom() { return this.api('room', {action: 'cancel'}); }
  async leaderboard() { return this.api('leaderboard'); }
  async saveDeck(deck) { this.profile = await this.api('profile', {deck}); return this.profile; }
  async setName(name) { this.profile = await this.api('profile', {name}); return this.profile; }
  async buy(itemId) { const r = await this.api('shop', {item: itemId}); if (r.profile) this.profile = r.profile; return r; }
  async equip(slot, itemId) { this.profile = await this.api('shop', {equip: slot, item: itemId}); return this.profile; }
  async tftWin(chapterIdx) { const r = await this.api('tft-win', {chapter: chapterIdx}); if (r.profile) this.profile = r.profile; return r; }
}

export async function connect() {
  // probe server mode quickly; fall back to local engine
  const probe = fetch('/api/session', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}'})
    .then(r => r.ok || r.status === 400 || r.status === 401 || r.status === 500 ? 'server' : 'local')
    .catch(() => 'local');
  const mode = await Promise.race([probe, new Promise(r => setTimeout(() => r('local'), 1800))]);
  if (mode === 'server') {
    try {
      const b = new ServerBackend();
      const res = await b.init();
      // keep match id handy for command calls
      b.onEvent(m => { if (m.matchId) b.match = {matchId: m.matchId, state: m.state, actor: m.actor, names: m.names, kind: m.kind, chapter: m.chapter}; });
      b.startStoryAndBind = async (ch, e) => { const m = await b.startStory(ch, e); b.match = {matchId: m.matchId, state: m.state, actor: m.actor, names: m.names, kind: m.kind, chapter: m.chapter}; return m; };
      if (res.active?.matchId) b.match = {matchId: res.active.matchId, state: res.active.state, actor: res.active.actor, names: res.active.names, kind: res.active.kind, chapter: res.active.chapter};
      return {backend: b, ...res};
    } catch {}
  }
  const b = new LocalBackend();
  const res = await b.init();
  return {backend: b, ...res};
}

export const content = {chapters, defaultDeck, enemyDeck, cardById, ECHOES, CARDS};
