/* Homepage climbing wall.
   Holds live in one SVG (viewBox 1000 × 720). The climber hangs by its hands from a "grip" point;
   any hold whose grip is within REACH of the current one lights up and can be clicked (or picked with arrow keys).
   Touching the TOP hold rings the bell, fires fireworks and shows the reward card. */
(() => {
  const root = document.getElementById('climb');
  if (!root) return;
  const svg = root.querySelector('svg');
  const NS = 'http://www.w3.org/2000/svg';
  const REACH = 200;
  const START = { x: 140, y: 612 };
  const COLORS = { coral: '#F07B6E', yellow: '#F6C945', blue: '#7DB7E8', green: '#9BD27A', purple: '#B793E6', orange: '#F59E5B', pink: '#F49CB8', gray: '#C9C3B8', teal: '#6FCFC4' };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const zh = () => document.documentElement.lang === 'zh-CN';
  const tr = (en, z) => (zh() ? z : en);

  // Blob holds: [x, y, radius, color, seed]. Letters are added below.
  const BLOBS = [
    [250, 560, 34, 'coral', 3, 'start'], [130, 470, 30, 'teal', 8], [335, 472, 28, 'yellow', 5],
    [262, 222, 30, 'blue', 11], [420, 182, 27, 'pink', 2], [582, 232, 33, 'green', 7], [722, 168, 29, 'orange', 13],
    [60, 300, 24, 'gray', 21], [935, 335, 30, 'purple', 4], [520, 610, 26, 'blue', 17], [792, 478, 30, 'yellow', 9],
    [380, 112, 22, 'teal', 30], [952, 470, 20, 'pink', 14], [650, 470, 20, 'gray', 23],
  ];
  const LETTERS = { text: 'AMANDA', x0: 200, step: 125, base: 404, size: 150, colors: ['purple', 'coral', 'yellow', 'blue', 'green', 'pink'], tilt: [-6, 4, -3, 7, -5, 3] };
  const TOP = { x: 862, y: 138 };

  /* ---------- tiny helpers ---------- */
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };
  const rand = seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function blobPath(cx, cy, r, seed) {
    const rnd = rand(seed * 7919 + 1), n = 7, p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.35, rr = r * (0.72 + rnd() * 0.5);
      p.push([cx + Math.cos(a) * rr * 1.28, cy + Math.sin(a) * rr]);
    }
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {   // closed Catmull-Rom → cubic Bézier
      const [p0, p1, p2, p3] = [p[(i - 1 + n) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  function bolt(x, y, parent) {
    el('circle', { cx: x, cy: y, r: 7.5, fill: '#4a4540' }, parent);
    el('circle', { cx: x, cy: y, r: 4.5, fill: '#d9d4cc' }, parent);
    el('path', { d: `M${x - 2.2},${y}h4.4M${x},${y - 2.2}v4.4`, stroke: '#6b655c', 'stroke-width': 1.2 }, parent);
  }

  /* ---------- build the wall ---------- */
  const holdsLayer = el('g', {}, svg), uiLayer = el('g', {}, svg);
  const holds = [];
  function addHold(g, grip, label, extra = {}) {
    g.classList.add('hold');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', label);
    const ring = el('circle', { class: 'ring', cx: grip.x, cy: grip.y, r: 46 });
    g.prepend(ring);
    holds.push({ g, x: grip.x, y: grip.y, label, ...extra });
  }
  BLOBS.forEach(([x, y, r, c, seed, tag]) => {
    const g = el('g', {}, holdsLayer);
    el('path', { d: blobPath(x, y, r, seed), fill: COLORS[c], class: 'shape' }, g);
    bolt(x, y, g);
    el('circle', { cx: x + r * 0.7, cy: y - r * 0.25, r: 2.6, fill: 'rgba(0,0,0,.32)' }, g);
    if (tag === 'start') {
      el('path', { d: `M${x - 18},${y + 22}l-10,58M${x - 4},${y + 24}l-6,60`, stroke: '#F49CB8', 'stroke-width': 9, 'stroke-linecap': 'butt', opacity: .85 }, g);
    }
    addHold(g, { x, y }, tag === 'start' ? 'Start hold' : 'Hold');
  });
  [...LETTERS.text].forEach((ch, i) => {
    const x = LETTERS.x0 + i * LETTERS.step, y = LETTERS.base, grip = { x, y: y - LETTERS.size * 0.42 };
    const g = el('g', { transform: `rotate(${LETTERS.tilt[i]} ${x} ${grip.y})` }, holdsLayer);
    const t = el('text', { x, y, 'text-anchor': 'middle', class: 'shape letter', fill: COLORS[LETTERS.colors[i]], 'font-size': LETTERS.size }, g);
    t.textContent = ch;
    bolt(x, grip.y, g);
    addHold(g, grip, `Letter ${ch}`);
  });
  // TOP hold + bell
  const topG = el('g', {}, holdsLayer);
  el('path', { d: blobPath(TOP.x, TOP.y, 30, 40), fill: COLORS.gray, class: 'shape' }, topG);
  bolt(TOP.x, TOP.y, topG);
  const tape = el('g', { transform: `rotate(-6 ${TOP.x} ${TOP.y + 46})` }, topG);
  el('rect', { x: TOP.x - 34, y: TOP.y + 34, width: 68, height: 24, rx: 3, fill: '#F6C945', opacity: .92 }, tape);
  const topTxt = el('text', { x: TOP.x, y: TOP.y + 52, 'text-anchor': 'middle', class: 'tape-text' }, tape); topTxt.textContent = 'TOP';
  const bell = el('g', { class: 'bell', style: `transform-origin:${TOP.x + 62}px ${TOP.y - 52}px` }, topG);
  el('path', { d: `M${TOP.x + 62},${TOP.y - 52}v8M${TOP.x + 44},${TOP.y - 8}c0-24 6-36 18-36s18 12 18 36z`, fill: '#F6C945', stroke: '#4a4060', 'stroke-width': 3, 'stroke-linejoin': 'round' }, bell);
  el('circle', { cx: TOP.x + 62, cy: TOP.y - 3, r: 5, fill: '#4a4060' }, bell);
  addHold(topG, TOP, 'Top hold — ring the bell', { top: true });

  // Floor mat
  el('rect', { x: 20, y: 696, width: 960, height: 26, rx: 12, class: 'mat' }, holdsLayer);

  /* ---------- two little extras: a sewn fabric patch (→ fashion page) and a shuttlecock ---------- */
  const defs = svg.querySelector('defs');
  defs.insertAdjacentHTML('beforeend', `<pattern id="gingham" width="12" height="12" patternUnits="userSpaceOnUse">
    <rect width="12" height="12" fill="#fff"/><rect width="6" height="12" fill="#FF8FC7" opacity=".45"/><rect width="12" height="6" fill="#FF8FC7" opacity=".45"/></pattern>`);
  const patch = el('a', { href: 'fashion.html', class: 'patch', transform: 'rotate(-7 862 612)' }, holdsLayer);
  el('rect', { x: 800, y: 578, width: 124, height: 68, rx: 6, fill: 'url(#gingham)', stroke: '#4a4060', 'stroke-width': 2 }, patch);
  el('rect', { x: 807, y: 585, width: 110, height: 54, rx: 3, fill: 'none', stroke: '#4a4060', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, patch);
  const patchTxt = el('text', { x: 862, y: 618, 'text-anchor': 'middle', class: 'patch-text' }, patch);
  const shuttle = el('g', { class: 'shuttle', role: 'button', tabindex: '0' }, uiLayer);
  shuttle.innerHTML = `<path d="M-14,-34 L14,-34 L7,-6 L-7,-6 Z" fill="#fff" stroke="#4a4060" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-7,-34 L-3,-6 M0,-34 L0,-6 M7,-34 L3,-6 M-11,-22 H11" stroke="#4a4060" stroke-width="1.5" fill="none"/>
    <path d="M-8,-6 H8 V0 A8,8 0 0 1 -8,0 Z" fill="#F6C945" stroke="#4a4060" stroke-width="2.5"/>`;
  const SHUTTLE_HOME = { x: 330, y: 690 };
  let shuttleFlying = false;
  const putShuttle = (p, a) => shuttle.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${a.toFixed(1)})`);
  putShuttle(SHUTTLE_HOME, 70);
  function serve() {
    if (shuttleFlying) return;
    shuttleFlying = true;
    const from = { ...SHUTTLE_HOME }, to = { x: 690, y: 690 }, dur = reduced ? 1 : 1300, t0 = performance.now();
    (function fly(now) {
      const t = Math.min(1, (now - t0) / dur);
      putShuttle({ x: from.x + (to.x - from.x) * t, y: from.y - Math.sin(Math.PI * t) * 430 }, 70 + 220 * t);   // cork leads, so it flips over the top
      if (t < 1) return requestAnimationFrame(fly);
      say(tr('I play badminton too!', '我也打羽毛球！'), { x: to.x, y: to.y - 50 }, 1800);
      setTimeout(() => { putShuttle(SHUTTLE_HOME, 70); shuttleFlying = false; }, 1900);
    })(t0);
  }
  shuttle.addEventListener('click', serve);
  shuttle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); serve(); } });

  /* ---------- the climber (placeholder until Amanda's own avatar) ---------- */
  const climber = el('g', { class: 'climber' }, uiLayer);
  const body = el('g', { class: 'climber-body' }, climber);
  body.innerHTML = `
    <path class="limb arm" d="M-9,36 Q-16,18 -11,2"/><path class="limb arm" d="M9,36 Q16,18 11,2"/>
    <circle cx="-11" cy="2" r="5.5" fill="#FFD9C2" stroke="#4a4060" stroke-width="2.5"/><circle cx="11" cy="2" r="5.5" fill="#FFD9C2" stroke="#4a4060" stroke-width="2.5"/>
    <path class="limb leg" d="M-5,70 Q-20,82 -16,98"/><path class="limb leg" d="M5,70 Q20,80 18,96"/>
    <rect x="-13" y="34" width="26" height="40" rx="11" fill="#B9A7F2" stroke="#4a4060" stroke-width="3"/>
    <circle cx="0" cy="20" r="17" fill="#FFD9C2" stroke="#4a4060" stroke-width="3"/>
    <path d="M-17,18 Q-16,1 0,2 Q16,1 17,18 Q8,9 -17,18z" fill="#4a4060"/><circle cx="0" cy="0" r="7" fill="#4a4060"/>
    <circle cx="-6" cy="22" r="2.2" fill="#4a4060"/><circle cx="6" cy="22" r="2.2" fill="#4a4060"/>
    <circle cx="-10" cy="27" r="3" fill="#FFB0A0" opacity=".8"/><circle cx="10" cy="27" r="3" fill="#FFB0A0" opacity=".8"/>
    <path d="M-3,28 q3,3 6,0" fill="none" stroke="#4a4060" stroke-width="2" stroke-linecap="round"/>
    <rect x="9" y="58" width="11" height="12" rx="4" fill="#F6C945" stroke="#4a4060" stroke-width="2.5"/>`;
  const bubble = el('g', { class: 'bubble' }, uiLayer);
  el('rect', { x: -62, y: -40, width: 124, height: 30, rx: 15, fill: '#fff', stroke: '#4a4060', 'stroke-width': 2.5 }, bubble);
  const bubbleTxt = el('text', { x: 0, y: -20, 'text-anchor': 'middle', class: 'bubble-text' }, bubble);

  /* ---------- state ---------- */
  let cur = { ...START }, moves = 0, busy = false, done = false;
  const place = (p, tilt = 0) => climber.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${tilt.toFixed(1)})`);
  const reachable = h => !busy && !done && Math.hypot(h.x - cur.x, h.y - cur.y) <= REACH && !(h.x === cur.x && h.y === cur.y);
  function say(text, p, ms = 1400) {
    bubbleTxt.textContent = text;
    bubble.setAttribute('transform', `translate(${p.x} ${p.y})`);
    bubble.classList.add('on');
    clearTimeout(say.t); say.t = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  function refresh() {
    holds.forEach(h => {
      const r = reachable(h);
      h.g.classList.toggle('reach', r);
      h.g.setAttribute('tabindex', r ? '0' : '-1');
      h.g.setAttribute('aria-disabled', !r);
    });
    root.querySelector('.moves').textContent = tr(`Moves: ${moves}`, `步数：${moves}`);
  }

  function climbTo(h) {
    if (done || busy) return;
    if (!reachable(h)) {
      h.g.classList.remove('nope'); void h.g.getBBox(); h.g.classList.add('nope');
      say(tr('Too far!', '太远啦！'), { x: h.x, y: h.y - 30 });
      return;
    }
    busy = true; refresh();
    const from = { ...cur }, to = { x: h.x, y: h.y }, dur = reduced ? 1 : 560, t0 = performance.now();
    const tilt = Math.max(-18, Math.min(18, (to.x - from.x) * 0.08));
    climber.classList.add('moving');
    (function step(now) {
      const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      place({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * 34 }, tilt * Math.sin(Math.PI * t));
      if (t < 1) return requestAnimationFrame(step);
      cur = to; moves++; busy = false; climber.classList.remove('moving');
      if (h.top) return win();
      refresh();
      // keyboard players keep focus on the wall: move it to a hold they can reach next
      if (root.contains(document.activeElement)) holds.find(x => x.g.classList.contains('reach'))?.g.focus({ preventScroll: true });
    })(performance.now());
  }

  /* ---------- input ---------- */
  holds.forEach(h => {
    h.g.addEventListener('click', () => climbTo(h));
    h.g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); climbTo(h); } });
  });
  root.addEventListener('keydown', e => {
    const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (!dir || done) return;
    e.preventDefault();
    // best reachable hold in that direction: aligned first, then close
    let best = null, bestScore = -Infinity;
    holds.forEach(h => {
      if (!reachable(h)) return;
      const dx = h.x - cur.x, dy = h.y - cur.y, d = Math.hypot(dx, dy), cos = (dx * dir[0] + dy * dir[1]) / d;
      const score = cos * 2 - d / REACH * 0.5;
      if (cos > 0.3 && score > bestScore) { best = h; bestScore = score; }
    });
    if (best) climbTo(best);
  });

  /* ---------- win: bell, fireworks, reward ---------- */
  const reward = root.querySelector('.reward');
  function win() {
    done = true; refresh();
    root.classList.add('won');
    bell.classList.add('ring');
    ding();
    let best = moves;
    try { best = Math.min(moves, +(localStorage.getItem('climb-best') || Infinity)); localStorage.setItem('climb-best', best); } catch {}
    reward.querySelector('.reward-moves').textContent = tr(`You topped out in ${moves} moves. Best: ${best}.`, `你用了 ${moves} 步登顶，最佳纪录 ${best} 步。`);
    reward.hidden = false;
    reward.querySelector('a').focus({ preventScroll: true });
    if (!reduced) fireworks();
  }
  root.querySelector('.again').addEventListener('click', () => {
    reward.hidden = true; done = false; moves = 0; cur = { ...START };
    root.classList.remove('won'); bell.classList.remove('ring');
    place(cur); refresh();
  });
  function ding() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [1318, 1975].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(i ? 0.05 : 0.12, ac.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.6);
        o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 1.7);
      });
    } catch {}
  }
  function fireworks() {
    const cv = root.querySelector('.fireworks'), ctx = cv.getContext('2d');
    const box = root.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = box.width * dpr; cv.height = box.height * dpr; ctx.scale(dpr, dpr);
    const pal = Object.values(COLORS), parts = [];
    const burst = (x, y) => { for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 4.5; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: pal[i % pal.length], r: 2 + Math.random() * 2.5 }); } };
    const confetti = () => { for (let i = 0; i < 90; i++) parts.push({ x: Math.random() * box.width, y: -20 - Math.random() * 200, vx: (Math.random() - .5) * 1.5, vy: 1 + Math.random() * 2, life: 1.6, c: pal[i % pal.length], r: 4, rect: true, spin: Math.random() * 6 }); };
    [[.82, .14], [.55, .22], [.3, .18], [.7, .35], [.45, .1]].forEach(([fx, fy], i) => setTimeout(() => burst(box.width * fx, box.height * fy), i * 320));
    confetti();
    const t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, box.width, box.height);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += p.rect ? 0.02 : 0.06; p.vx *= 0.985; p.life -= p.rect ? 0.004 : 0.012;
        if (p.life <= 0) return;
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.c;
        if (p.rect) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin += 0.08); ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      });
      if (now - t0 < 4500) requestAnimationFrame(frame); else ctx.clearRect(0, 0, box.width, box.height);
    })(t0);
  }

  // text that depends on the language
  function texts() {
    patchTxt.textContent = tr('FASHION →', '服装 →');
    patch.setAttribute('aria-label', tr('Fashion design work', '服装设计作品'));
    shuttle.setAttribute('aria-label', tr('Serve the shuttlecock', '把羽毛球打出去'));
    root.querySelector('.hint').textContent = tr('Click a glowing hold to climb — ring the bell at the top! (arrow keys work too)', '点亮起来的岩点往上爬，摸到顶上的铃铛就登顶！（也可以用方向键）');
    refresh();
  }
  new MutationObserver(texts).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  place(cur); texts();
  setTimeout(() => say(tr('This is you!', '这是你！'), { x: cur.x, y: cur.y - 6 }, 2600), 900);
})();
