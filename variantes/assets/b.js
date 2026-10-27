/* Variante B · la ruta se dibuja con el scroll */
(() => {
  const box = document.querySelector('.rideB'); if (!box) return;
  const svg = box.querySelector('svg'), $ = id => document.getElementById(id);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KM = 100;
  // perfil ilustrativo [x 0..1, altura 0..1]
  const PROF = [[0,.18],[.06,.22],[.12,.16],[.19,.3],[.25,.26],[.31,.38],[.37,.33],[.43,.42],[.49,.36],[.55,.48],[.61,.58],[.66,.74],[.71,.92],[.75,.84],[.8,.62],[.85,.55],[.9,.4],[.95,.34],[1,.3]];
  let W = 0, H = 0, pts = [], len = 0, line = $('bLine'), shown = 0, target = 0, intro = 0, t0 = 0, ticks = [];
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };
  function smooth(P) { let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`; for (let i = 0; i < P.length - 1; i++) { const a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c; d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`; } return d; }
  function layout() {
    const r = box.getBoundingClientRect(); W = r.width; H = r.height;
    const mx = W < 700 ? 28 : Math.max(48, (W - 1320) / 2 + 48), top = H * .22, base = H - 58;
    pts = PROF.map(([x, y]) => [mx + x * (W - 2 * mx), base - y * (base - top)]);
    const d = smooth(pts);
    for (const id of ['bLine', 'bGlowPath', 'bGhost']) $(id).setAttribute('d', d);
    $('bArea').setAttribute('d', d + `L${pts.at(-1)[0]},${base}L${pts[0][0]},${base}Z`);
    const g = $('bStroke'); g.setAttribute('x1', mx); g.setAttribute('x2', W - mx);
    len = line.getTotalLength();
    for (const id of ['bLine', 'bGlowPath']) $(id).style.strokeDasharray = `${len} ${len}`;
    // grilla y km
    const grid = $('bGrid'), tk = $('bTicks'); grid.textContent = ''; tk.textContent = ''; ticks = [];
    for (let i = 0; i < 4; i++) { const y = top + i * (base - top) / 3; el('line', { x1: mx, x2: W - mx, y1: y, y2: y }, grid); }
    const step = W < 700 ? 25 : 10;
    for (let k = step; k < KM; k += step) {
      const x = mx + k / KM * (W - 2 * mx), y = yAt(x), g2 = el('g', {}, tk);
      el('line', { x1: x, x2: x, y1: y + 6, y2: base + 10 }, g2);
      el('circle', { class: 'dot', cx: x, cy: y, r: 3.2 }, g2);
      const t = el('text', { x, y: base + 26 }, g2); t.textContent = k + ' km';
      ticks.push([k / KM, g2]);
    }
    $('bStart').setAttribute('transform', `translate(${pts[0][0]},${pts[0][1]})`);
    $('bEnd').setAttribute('transform', `translate(${pts.at(-1)[0]},${pts.at(-1)[1]})`);
    draw(shown);
  }
  function yAt(x) { let lo = 0, hi = len; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; line.getPointAtLength(m).x < x ? lo = m : hi = m; } return line.getPointAtLength(lo).y; }
  function draw(p) {
    p = Math.max(0, Math.min(1, p));
    const L = len * p, pt = line.getPointAtLength(L);
    for (const id of ['bLine', 'bGlowPath']) $(id).style.strokeDashoffset = len - L;
    $('bRevealRect').setAttribute('width', pt.x);
    $('bMarker').setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
    $('bMarker').style.opacity = p < .004 ? 0 : 1;
    // fracción en km según la x proyectada
    const f = (pt.x - pts[0][0]) / (pts.at(-1)[0] - pts[0][0]);
    $('bKm').textContent = p >= .999 ? 'Meta' : 'km ' + Math.round(f * KM);
    ticks.forEach(([q, g]) => g.classList.toggle('on', f >= q - .002));
    $('bEnd').classList.toggle('done', p >= .999);
    $('bStart').style.opacity = 1;
  }
  function scrollTarget() {
    const r = box.getBoundingClientRect(), vh = innerHeight;
    return Math.max(0, Math.min(1, (vh - r.top - r.height * .35) / (vh * .7)));
  }
  layout(); addEventListener('resize', layout);
  if (RM) { draw(1); return; }
  let on = true;
  new IntersectionObserver(e => { on = e[0].isIntersecting; on && requestAnimationFrame(loop); }).observe(box);
  t0 = performance.now();
  function loop(now) {
    intro = Math.min(1, (now - t0) / 2400);
    const ease = 1 - Math.pow(1 - intro, 3);
    target = Math.max(.22 * ease, scrollTarget());
    shown += (target - shown) * .08;
    if (Math.abs(target - shown) < .0005) shown = target;
    draw(shown);
    if (on) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
