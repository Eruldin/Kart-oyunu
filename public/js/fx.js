// FX: damage popups, particle bursts, screen shake, target arrows, flashes.
const root = () => document.querySelector('#fx-root');
export const reduced = () => document.documentElement.classList.contains('reduced');

function center(el) {
  const r = el.getBoundingClientRect();
  return {x: r.left + r.width / 2, y: r.top + r.height / 2, r};
}

export function popup(el, text, cls = 'dmg') {
  if (!el) return;
  const p = center(el);
  const d = document.createElement('div');
  d.className = `fx-pop ${cls}`;
  d.textContent = text;
  d.style.left = p.x + 'px';
  d.style.top = (p.y - 14) + 'px';
  root().append(d);
  setTimeout(() => d.remove(), 1250);
}

const BURST_COLORS = {
  gold: ['#e5c285', '#f1dfa3', '#caa45e'],
  violet: ['#a370d7', '#6b2fa3', '#d3b1ff'],
  green: ['#b4c75c', '#d6e79c', '#7fa04a'],
  steel: ['#cfd8dc', '#90a4ae', '#e8f4f8'],
  red: ['#e0705c', '#b3141f', '#ffb199'],
  white: ['#ffffff', '#cfe8ff', '#9ec7e8'],
};
export function burst(el, kind = 'gold', n = 18) {
  if (!el || reduced()) return;
  const p = center(el);
  const fx = document.createElement('div');
  fx.className = 'fx-burst';
  fx.style.left = p.x + 'px';
  fx.style.top = p.y + 'px';
  const colors = BURST_COLORS[kind] || BURST_COLORS.gold;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const ang = (i / n) * 360 + Math.random() * 22;
    const dist = 34 + Math.random() * 66;
    const c = colors[i % colors.length];
    s.style.setProperty('--dx', Math.cos(ang * Math.PI / 180) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(ang * Math.PI / 180) * dist + 'px');
    s.style.background = c;
    s.style.boxShadow = `0 0 8px ${c}`;
    fx.append(s);
  }
  const ring = document.createElement('b');
  fx.append(ring);
  root().append(fx);
  setTimeout(() => fx.remove(), 900);
}

export function shake(el, power = 1) {
  if (!el || reduced()) return;
  el.style.setProperty('--shake', power);
  el.classList.remove('fx-shake');
  void el.offsetWidth;
  el.classList.add('fx-shake');
  setTimeout(() => el.classList.remove('fx-shake'), 450);
}

export function flash(color = 'rgba(255,255,255,.35)', ms = 160) {
  if (reduced()) return;
  const f = document.createElement('div');
  f.className = 'fx-flash';
  f.style.background = color;
  root().append(f);
  setTimeout(() => f.remove(), ms + 80);
}

// svg arrow from one element to another (targeting / combat lines)
let arrowLayer = null;
export function arrowLayerEl() {
  if (!arrowLayer) {
    arrowLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowLayer.setAttribute('class', 'fx-arrows');
    document.body.append(arrowLayer);
  }
  return arrowLayer;
}
export function clearArrows() { arrowLayerEl().innerHTML = ''; }
export function arrow(fromEl, toEl, color = '#e5c285', dashed = false) {
  if (!fromEl || !toEl) return;
  const a = center(fromEl), b = center(toEl);
  const svg = arrowLayerEl();
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 46;
  line.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
  line.setAttribute('class', 'fx-arrow' + (dashed ? ' dashed' : ''));
  line.style.stroke = color;
  svg.append(line);
  const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  head.setAttribute('cx', b.x); head.setAttribute('cy', b.y); head.setAttribute('r', 5);
  head.setAttribute('class', 'fx-arrow-head'); head.style.fill = color;
  svg.append(head);
}
export function arrowToPoint(fromEl, x, y, color = '#e5c285') {
  if (!fromEl) return;
  const a = center(fromEl);
  const svg = arrowLayerEl();
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const mx = (a.x + x) / 2, my = Math.min(a.y, y) - 40;
  line.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${x} ${y}`);
  line.setAttribute('class', 'fx-arrow');
  line.style.stroke = color;
  svg.append(line);
}

export function summonGlow(el, kind = 'gold') {
  if (!el || reduced()) return;
  el.classList.add('fx-summon');
  burst(el, kind, 14);
  setTimeout(() => el.classList.remove('fx-summon'), 700);
}
export function dieAnim(el) {
  if (!el) return;
  el.classList.add('fx-dying');
}
export function lunge(el, towardEl) {
  if (!el || !towardEl || reduced()) return;
  const a = center(el), b = center(towardEl);
  el.style.setProperty('--lx', (b.x - a.x) * 0.35 + 'px');
  el.style.setProperty('--ly', (b.y - a.y) * 0.35 + 'px');
  el.classList.remove('fx-lunge');
  void el.offsetWidth;
  el.classList.add('fx-lunge');
  setTimeout(() => el.classList.remove('fx-lunge'), 420);
}
export function trail(fromEl, toEl, cls = 'gold') {
  // a small "card" that flies from hand to target
  if (!fromEl || !toEl || reduced()) return;
  const a = center(fromEl), b = center(toEl);
  const g = document.createElement('div');
  g.className = `fx-ghost ${cls}`;
  g.style.left = a.x + 'px';
  g.style.top = a.y + 'px';
  root().append(g);
  requestAnimationFrame(() => {
    g.style.transform = `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(.55)`;
    g.style.opacity = '0';
  });
  setTimeout(() => g.remove(), 620);
}
