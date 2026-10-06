// Audio manager: real SFX/music files, lazy-loaded, pooled, volume-gated.
const A = './assets/audio';
const SFX = {
  uiClick: ['sfx/ui-click-1.ogg', 'sfx/ui-click-2.ogg'],
  uiHover: ['ui/hover.ogg'],
  uiConfirm: ['ui/confirm.ogg'],
  uiError: ['ui/error.ogg'],
  cardDraw: ['sfx/card-draw-1.ogg', 'sfx/card-draw-2.ogg', 'sfx/card-draw-3.ogg'],
  cardPlay: ['sfx/card-play-1.ogg', 'sfx/card-play-2.ogg', 'sfx/card-play-3.ogg'],
  cardPlace: ['sfx/card-place.ogg'],
  cardHover: ['sfx/hover-tick.ogg'],
  shuffle: ['sfx/card-shuffle.ogg'],
  summon: ['sfx/cue-summon.wav'],
  attack: ['sfx/attack-declare-1.ogg', 'sfx/attack-declare-2.ogg'],
  slash: ['sfx/attack-slash.ogg', 'sfx/attack-swipe.ogg'],
  hitLight: ['sfx/hit-light-1.ogg', 'sfx/hit-light-2.ogg'],
  hitHeavy: ['sfx/hit-heavy.ogg', 'sfx/hit-heavy-2.ogg', 'sfx/hit-metal.ogg'],
  block: ['sfx/block-1.ogg', 'sfx/block-2.ogg'],
  blockLock: ['sfx/block-lock.ogg'],
  death: ['sfx/unit-death-1.ogg', 'sfx/unit-death-2.ogg'],
  heal: ['sfx/cue-heal.wav', 'sfx/heal.mp3'],
  memory: ['sfx/cue-memory.wav'],
  steel: ['sfx/cue-steel-impact.wav'],
  void: ['sfx/cue-void.wav'],
  magic: ['sfx/spell-big.mp3', 'sfx/magic-swoosh.mp3'],
  fire: ['sfx/spell-fire.mp3'],
  thunder: ['sfx/spell-thunder.mp3'],
  ultimate: ['sfx/cue-ultimate.wav', 'sfx/echo-ultimate.mp3'],
  echoCharge: ['sfx/echo-charge.ogg'],
  echoShine: ['sfx/echo-shine.mp3'],
  victory: ['sfx/cue-victory.wav', 'sfx/victory.mp3'],
  defeat: ['sfx/defeat.ogg'],
  turn: ['sfx/turn-chime.ogg', 'sfx/turn-token.ogg'],
  select: ['sfx/ui-select.ogg'],
  confirm: ['sfx/ui-confirm.ogg'],
  error: ['sfx/ui-error.ogg'],
  teleport: ['sfx/teleport.mp3'],
  loreOpen: ['sfx/lore-open.ogg'],
  storyOpen: ['sfx/story-open.ogg'],
  storyClose: ['sfx/story-close.ogg'],
  dice: ['sfx/dice-throw.ogg'],
  fireplace: ['sfx/fireplace-loop.ogg'],
  wind: ['sfx/ambience-wind.mp3'],
};
const MUSIC = {
  menu: ['music/menu-angevin.mp3'],
  battle: ['music/battle-clenched-teeth.mp3', 'music/battle-volatile.mp3'],
  story: ['music/story-house-of-leaves.mp3'],
  echo: ['music/echo-unlight.mp3'],
};

const cache = new Map();
let sfxVol = +(localStorage.getItem('eruldin.sfx') ?? 0.8);
let musVol = +(localStorage.getItem('eruldin.music') ?? 0.55);
let muted = localStorage.getItem('eruldin.muted') === '1';
let musicEl = null, musicKey = null, musicFiles = [], musicIdx = 0;

function load(path) {
  if (!cache.has(path)) {
    const a = new Audio(`${A}/${path}`);
    a.preload = 'auto';
    cache.set(path, a);
  }
  return cache.get(path);
}
export function sfx(name, {vol = 1, rate = 1} = {}) {
  if (muted || !sfxVol) return;
  const files = SFX[name];
  if (!files) return;
  const src = load(files[(Math.random() * files.length) | 0]);
  try {
    const a = src.cloneNode();
    a.volume = Math.min(1, sfxVol * vol);
    a.playbackRate = rate;
    a.play().catch(() => {});
  } catch {}
}
export function music(kind) {
  if (musicKey === kind) return;
  musicKey = kind;
  musicFiles = MUSIC[kind] || [];
  musicIdx = 0;
  startTrack();
}
function startTrack() {
  stopMusic();
  if (!musicFiles.length) return;
  musicEl = new Audio(`${A}/${musicFiles[musicIdx % musicFiles.length]}`);
  musicEl.volume = muted ? 0 : musVol;
  musicEl.loop = musicFiles.length === 1;
  musicEl.onended = () => { musicIdx++; startTrack(); };
  musicEl.play().catch(() => {});
}
export function stopMusic() { if (musicEl) { musicEl.pause(); musicEl = null; } }
export function duck(on) { if (musicEl) musicEl.volume = (muted ? 0 : musVol) * (on ? 0.25 : 1); }
export function setSfxVol(v) { sfxVol = v; localStorage.setItem('eruldin.sfx', v); }
export function setMusVol(v) { musVol = v; localStorage.setItem('eruldin.music', v); if (musicEl) musicEl.volume = muted ? 0 : v; }
export function setMuted(m) { muted = m; localStorage.setItem('eruldin.muted', m ? '1' : '0'); if (musicEl) musicEl.volume = m ? 0 : musVol; }
export const vols = () => ({sfxVol, musVol, muted});
// Browsers block autoplay — first gesture unlocks.
export function unlock() {
  document.addEventListener('pointerdown', function once() {
    document.removeEventListener('pointerdown', once);
    if (musicKey && !musicEl) startTrack();
  }, {once: true});
}
