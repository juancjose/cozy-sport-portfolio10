/* =========================================================
   Cozy Sport — "Elegí tu disciplina y ganate un cupón"
   Vanilla JS + canvas. Solo lo carga juego.html (vista previa).
   ========================================================= */
(() => {
'use strict';

/* ======================= CONFIGURACIÓN ======================= */
// ⚠️ PLACEHOLDER: este código TIENE QUE EXISTIR como cupón en la tienda (tiendacozy.com)
// con el mismo porcentaje antes de publicar el juego. Cambiá solo estos dos valores.
const CUPON = { codigo: 'COZY-PRUEBA', descuento: '10%' };
const TIENDA = 'https://tiendacozy.com/';
// Claves de localStorage: cupón ganado (uno por dispositivo) y "ya lo vio / lo cerró".
const LS_TICKET = 'cozy-cupon', LS_VISTO = 'cozy-juego-visto';
/* ============================================================= */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = { ink:'#0b0c0b', ink2:'#121413', ink3:'#1a1d1b', paper:'#f4f3ee', paper2:'#e9e8e1', green:'#00af31', hi:'#2ee566', deep:'#007a22', muted:'#9aa19c' };
const FD = '"Archivo", system-ui, sans-serif', FM = '"JetBrains Mono", ui-monospace, monospace';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const fmt = s => Math.max(0, s).toFixed(1) + ' s';

/* ---------- storage ---------- */
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const qs = new URLSearchParams(location.search);
if (qs.has('reset-juego')) {
  ls.del(LS_TICKET); ls.del(LS_VISTO);
  qs.delete('reset-juego');
  const q = qs.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
}
const getTicket = () => { try { const t = JSON.parse(ls.get(LS_TICKET) || 'null'); return t && t.codigo ? t : null; } catch (e) { return null; } };

/* ---------- logo Cozy (Z del sprite) ---------- */
let ZP = null, ZT = [51.2, 101.74, 0.126186];
try {
  const p = document.querySelector('#i-z path');
  ZP = new Path2D(p.getAttribute('d'));
  const m = (p.getAttribute('transform') || '').match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)\s*scale\(([-\d.]+)\)/);
  if (m) ZT = [+m[1], +m[2], +m[3]];
} catch (e) { ZP = null; }
function drawZ(c, x, y, w, color) {   // w = ancho del logo
  c.save(); c.translate(x, y); const s = w / 412; c.scale(s, s); c.translate(-256, -256);
  c.translate(ZT[0], ZT[1]); c.scale(ZT[2], ZT[2]); c.fillStyle = color;
  if (ZP) c.fill(ZP, 'evenodd'); c.restore();
}
function drawBall(c, x, y, r, rot = 0, shadow = true) {
  if (!(r > .5)) return;
  if (shadow) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x + r * .15, y + r * .9, r * .9, r * .28, 0, 0, TAU); c.fill(); }
  c.save(); c.translate(x, y);
  c.fillStyle = '#111312'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.lineWidth = Math.max(1.2, r * .09); c.strokeStyle = C.paper; c.stroke();
  c.rotate(rot); drawZ(c, 0, 0, r * 1.22, C.paper);
  c.rotate(-rot);
  const g = c.createRadialGradient(-r * .4, -r * .45, 0, -r * .4, -r * .45, r * 1.3);
  g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.restore();
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function line(c, x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function text(c, s, x, y, size, color, align = 'center', font = FD, weight = 800) {
  c.font = `${weight} ${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle';
  try { c.fontStretch = font === FD ? 'condensed' : 'normal'; } catch (e) {}
  c.fillText(s, x, y);
}
// Pseudo-aleatorio estable por índice (para público, pasto, etc.)
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- figura deportista (pictograma, vista lateral) ---------- */
function drawRunner(c, x, yf, H, ph, opt = {}) {
  const lean = opt.lean ?? .2, air = opt.air || 0;
  const thigh = H * .25, shin = H * .25, torso = H * .3, ua = H * .16, fa = H * .15;
  const hip = [x, yf - H * .5 + air * H * .04];
  const limb = (side, back) => {
    let a = Math.sin(ph + side * Math.PI) * .85;
    if (air) a = side ? -.5 : .9;
    const knee = [hip[0] + Math.sin(a) * thigh, hip[1] + Math.cos(a) * thigh];
    const bend = air ? (side ? 1.6 : .3) : .25 + .95 * (1 + Math.cos(ph + side * Math.PI + .8)) / 2;
    const b = a - bend;
    const foot = [knee[0] + Math.sin(b) * shin, knee[1] + Math.cos(b) * shin];
    c.strokeStyle = back ? '#a7aca8' : C.paper2; c.lineWidth = H * .075;
    c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(knee[0], knee[1]); c.lineTo(foot[0], foot[1]); c.stroke();
    c.strokeStyle = back ? C.deep : C.hi; c.lineWidth = H * .06;
    line(c, foot[0] - H * .01, foot[1], foot[0] + H * .07, foot[1] + H * .005);
  };
  const sh = [hip[0] + Math.sin(lean) * torso, hip[1] - Math.cos(lean) * torso];
  const arm = (side, back) => {
    const a = -Math.sin(ph + side * Math.PI) * .95, el = [sh[0] + Math.sin(a) * ua, sh[1] + Math.cos(a) * ua];
    const b = a + 1.5, hd = [el[0] + Math.sin(b) * fa, el[1] + Math.cos(b) * fa];
    c.strokeStyle = back ? '#a7aca8' : C.paper2; c.lineWidth = H * .065;
    c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(hd[0], hd[1]); c.stroke();
  };
  c.lineCap = 'round'; c.lineJoin = 'round';
  limb(1, true); arm(0, true);
  c.strokeStyle = '#1e2421'; c.lineWidth = H * .16; line(c, hip[0], hip[1] + H * .02, hip[0] + Math.sin(lean) * H * .06, hip[1] - H * .06);
  c.strokeStyle = C.green; c.lineWidth = H * .15; line(c, hip[0] + Math.sin(lean) * H * .07, hip[1] - H * .07, sh[0], sh[1]);
  limb(0, false); arm(1, false);
  c.fillStyle = C.paper2; c.beginPath(); c.arc(sh[0] + H * .05, sh[1] - H * .1, H * .075, 0, TAU); c.fill();
}

/* =============================================================
   JUEGOS: cada uno devuelve {status,update,draw,press,release,tap,hud,controls,state}
   ============================================================= */

/* ---------- RUNNING: apretar rápido para correr, saltar vallas ---------- */
function makeRun(o = {}) {
  o = Object.assign({ goal: 100, limit: 20, hurdles: [16, 30, 44, 58, 72, 86] }, o);
  const g = { id: 'run', status: 'play', t: 0, d: 0, v: 0, y: 0, vy: 0, stum: 0, ph: 0, flash: 0, why: '' };
  const hs = o.hurdles.map(x => ({ x, hit: false, rot: 0 }));
  const VMAX = 10.5, GRAV = 26, JUMP = 7.4;
  g.controls = [{ a: 'a', label: 'Correr', key: 'Espacio', main: true }, { a: 'up', label: 'Saltar', key: '↑' }];
  g.help = { kb: [['Espacio', 'Apretá rápido para correr'], ['↑ / W', 'Saltá las vallas']], touch: [['Correr', 'Tocá rápido para acelerar'], ['Saltar', 'Pasá las vallas sin tirarlas']], goal: `${o.goal} metros con vallas en menos de ${o.limit} segundos.` };
  g.press = a => {
    if (g.status !== 'play') return;
    if (a === 'a' && g.stum <= 0) g.v = Math.min(VMAX, g.v + 1.05);
    if (a === 'up' && g.y <= 0 && g.vy <= 0) g.vy = JUMP;
  };
  g.tap = () => g.press('a');
  g.update = dt => {
    g.t += dt; g.v -= g.v * .55 * dt; if (g.stum > 0) g.stum -= dt;
    g.d += g.v * dt; g.ph += g.v * dt * 1.25 + dt * .6;
    if (g.y > 0 || g.vy > 0) { g.y += g.vy * dt; g.vy -= GRAV * dt; if (g.y <= 0) { g.y = 0; g.vy = 0; } }
    for (const h of hs) {
      if (h.hit) { h.rot = Math.min(Math.PI / 2, h.rot + dt * 8); continue; }
      if (Math.abs(g.d - h.x) < .32 && g.y < .78) { h.hit = true; g.stum = .55; g.v *= .2; g.flash = .4; }
    }
    if (g.flash > 0) g.flash -= dt;
    if (g.d >= o.goal) { g.d = o.goal; g.status = 'win'; }
    else if (g.t >= o.limit) { g.status = 'lose'; g.why = 'Se terminó el tiempo antes de la meta.'; }
  };
  g.hud = () => ({ l: `${Math.floor(g.d)} / ${o.goal} m`, r: fmt(o.limit - g.t), p: g.d / o.goal, warn: o.limit - g.t < 4 });
  g.state = () => { const nx = hs.find(h => !h.hit && h.x > g.d); return { d: g.d, v: g.v, y: g.y, next: nx ? nx.x - g.d : 99 }; };
  g.draw = (c, W, H, T) => {
    const ppm = Math.min(W / 11, H / 4.6), gy = H * .74, px = W * .28;
    const sx = x => px + (x - g.d) * ppm;
    const bg = c.createLinearGradient(0, 0, 0, gy); bg.addColorStop(0, '#0d0f0e'); bg.addColorStop(1, '#1a1e1c');
    c.fillStyle = bg; c.fillRect(0, 0, W, gy);
    const top = gy - ppm * 2.9;
    // tribuna con público (parallax); en pantallas altas ocupa todo el cielo
    const rh = ppm * .32, rows = clamp(Math.floor((top - 54) / rh), 4, 16), st0 = top - rows * rh - ppm * .15;
    c.fillStyle = '#141816'; c.fillRect(0, st0, W, top - st0 + 2);
    const off = g.d * ppm * .35, step = Math.max(7, ppm * .22);
    for (let row = 0; row < rows; row++) {
      const yy = top - rh * (rows - row) + rh * .45, i0 = Math.floor(off / step) - 1, fade = .45 + .55 * (row + 1) / rows;
      if (row % 4 === 0 && row) { c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(0, yy - rh * .62, W, 2); }
      for (let i = i0; i < i0 + W / step + 2; i++) {
        const h = hash(i * 7 + row * 131); if (h < .25) continue;
        c.fillStyle = h > .93 ? `rgba(46,229,102,${.55 * fade})` : `rgba(255,255,255,${(.05 + h * .09) * fade})`;
        c.beginPath(); c.arc(i * step - off + (row % 2) * step / 2, yy, step * .28, 0, TAU); c.fill();
      }
    }
    if (st0 > 70) { // techo de la tribuna con luces
      c.fillStyle = '#0a0b0a'; c.fillRect(0, st0 - ppm * .25, W, ppm * .25);
      for (let x = W * .12; x < W; x += W * .25) { const lg = c.createRadialGradient(x, st0 - ppm * .12, 0, x, st0 - ppm * .12, ppm * 1.4); lg.addColorStop(0, 'rgba(255,255,255,.16)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(x - ppm * 1.4, st0 - ppm * 1.5, ppm * 2.8, ppm * 2.8); c.fillStyle = '#f4f3ee'; c.fillRect(x - ppm * .18, st0 - ppm * .17, ppm * .36, ppm * .1); }
    }
    // carteles
    c.fillStyle = C.ink; c.fillRect(0, top, W, ppm * .7);
    const off2 = g.d * ppm * .85, bw = ppm * 4.2, i1 = Math.floor(off2 / bw) - 1;
    for (let i = i1; i < i1 + W / bw + 2; i++) {
      const x = i * bw - off2, hl = ((i % 3) + 3) % 3 === 0;
      c.fillStyle = hl ? C.green : '#161917'; c.fillRect(x + 2, top + 3, bw - 4, ppm * .7 - 6);
      drawZ(c, x + ppm * .55, top + ppm * .35, ppm * .55, hl ? '#fff' : C.green);
      text(c, 'COZY SPORT', x + ppm * .95, top + ppm * .36, ppm * .3, hl ? '#fff' : '#d5d8d5', 'left');
    }
    // pista
    c.fillStyle = '#8f3a2a'; c.fillRect(0, top + ppm * .7, W, H);
    const tg = c.createLinearGradient(0, top + ppm * .7, 0, H); tg.addColorStop(0, 'rgba(0,0,0,.4)'); tg.addColorStop(.5, 'rgba(0,0,0,.08)'); tg.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = tg; c.fillRect(0, top + ppm * .7, W, H);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (const yy of [top + ppm * 1.4, gy + ppm * .35, H - ppm * .25]) line(c, 0, yy, W, yy);
    for (let m = 0; m <= o.goal; m += 10) {
      const x = sx(m); if (x < -60 || x > W + 60) continue;
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; line(c, x, top + ppm * 1.4, x, H);
      if (m && m < o.goal) text(c, m + ' m', x + 6, H - ppm * .55, Math.max(11, ppm * .26), 'rgba(255,255,255,.7)', 'left', FM, 700);
    }
    // meta con el logo
    const fx = sx(o.goal);
    if (fx < W + 300) {
      const sq = Math.max(6, ppm * .18);
      for (let yy = top + ppm * 1.4, k = 0; yy < H; yy += sq, k++) for (let j = 0; j < 2; j++) { c.fillStyle = (k + j) % 2 ? '#111' : C.paper; c.fillRect(fx + j * sq - sq, yy, sq, sq); }
      const ah = ppm * 3.1, aw = ppm * 1.2;
      c.strokeStyle = '#d9dcd9'; c.lineWidth = Math.max(3, ppm * .08); c.lineCap = 'round';
      line(c, fx - aw, gy, fx - aw, gy - ah); line(c, fx + aw, gy + ppm * .4, fx + aw, gy - ah);
      rr(c, fx - aw * 1.25, gy - ah - ppm * .55, aw * 2.5, ppm * .75, 6); c.fillStyle = C.ink; c.fill();
      c.strokeStyle = C.green; c.lineWidth = 2; c.stroke();
      drawBall(c, fx - aw * .62, gy - ah - ppm * .17, ppm * .27, 0, false);
      text(c, 'META', fx + aw * .2, gy - ah - ppm * .17, ppm * .36, '#fff');
    }
    // vallas
    for (const h of hs) {
      const x = sx(h.x); if (x < -80 || x > W + 80) continue;
      const hh = ppm * .84, ww = ppm * .1;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, gy + 2, ppm * .3, ppm * .05, 0, 0, TAU); c.fill();
      c.save(); c.translate(x, gy); c.rotate(h.rot);
      c.strokeStyle = '#cfd2cf'; c.lineWidth = Math.max(2, ppm * .05); c.lineCap = 'round';
      line(c, 0, 0, 0, -hh); line(c, -ppm * .25, 0, ppm * .2, 0);
      c.fillStyle = C.paper; c.fillRect(-ww, -hh - ppm * .06, ww * 2.2, ppm * .2);
      c.fillStyle = C.green; c.fillRect(-ww, -hh - ppm * .06, ww * 1.1, ppm * .2);
      c.restore();
    }
    // corredor
    const ry = gy - g.y * ppm;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(px + ppm * .1, gy + 2, ppm * (.45 - Math.min(.25, g.y * .2)), ppm * .07, 0, 0, TAU); c.fill();
    if (!reduce && g.v > 7) { c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const yy = ry - ppm * (.5 + i * .35), l = ppm * (.6 + hash(i + Math.floor(T * 8)) * .8); line(c, px - ppm * .5 - l, yy, px - ppm * .5, yy); } }
    c.save(); if (g.stum > 0 && !reduce) { c.translate(px, gy); c.rotate(.3 * Math.sin(g.stum * 6)); c.translate(-px, -gy); }
    drawRunner(c, px, ry, ppm * 1.8, g.ph, { air: g.y > .05 ? 1 : 0, lean: .12 + g.v * .015 });
    c.restore();
    if (g.flash > 0) { c.fillStyle = `rgba(255,80,60,${g.flash * .3})`; c.fillRect(0, 0, W, H); }
  };
  return g;
}

/* ---------- CICLISMO: cambiar de carril, esquivar pozos y conos ---------- */
function makeBike(o = {}) {
  o = Object.assign({ goal: 300, lives: 3, v0: 12, v1: 18 }, o);
  const g = { id: 'bike', status: 'play', t: 0, d: 0, lane: 1, x: 1, hits: 0, inv: 0, slow: 1, flash: 0, why: '', tilt: 0 };
  const obs = [], kind = () => Math.random() < .5 ? 'cone' : 'hole';
  let nd = 26;
  while (nd < o.goal - 14) {
    const a = Math.floor(Math.random() * 3);
    obs.push({ d: nd, lane: a, k: kind(), hit: false, s: Math.random() });
    if (Math.random() < .42) { const b = (a + 1 + Math.floor(Math.random() * 2)) % 3; obs.push({ d: nd + (Math.random() < .5 ? 0 : 2.5), lane: b, k: kind(), hit: false, s: Math.random() }); }
    nd += 15 + Math.random() * 7;
  }
  g.controls = [{ a: 'left', label: '◀  Izquierda', key: '← / A' }, { a: 'right', label: 'Derecha  ▶', key: '→ / D' }];
  g.help = { kb: [['← / A', 'Carril izquierdo'], ['→ / D', 'Carril derecho']], touch: [['◀ ▶', 'Cambiá de carril (o tocá un costado de la ruta)']], goal: `Llegá a la meta de ${o.goal} m esquivando pozos y conos. Tenés ${o.lives} vidas.` };
  g.press = a => { if (g.status !== 'play') return; if (a === 'left') g.lane = Math.max(0, g.lane - 1); if (a === 'right') g.lane = Math.min(2, g.lane + 1); };
  g.tap = (x, y, W) => g.press(x < W / 2 ? 'left' : 'right');
  g.update = dt => {
    g.t += dt;
    const v = lerp(o.v0, o.v1, Math.min(1, g.d / o.goal)) * g.slow;
    g.slow = Math.min(1, g.slow + dt * .6);
    g.d += v * dt;
    const px = g.x; g.x += (g.lane - g.x) * Math.min(1, dt * 14); g.tilt = (g.x - px) / Math.max(dt, .001) * .05;
    if (g.inv > 0) g.inv -= dt; if (g.flash > 0) g.flash -= dt;
    const cl = Math.round(g.x);
    for (const ob of obs) {
      if (ob.hit || g.inv > 0 || g.status !== 'play') continue;
      if (ob.lane === cl && Math.abs(g.x - cl) < .35 && ob.d - g.d < .9 && ob.d - g.d > -.5) {
        ob.hit = true; g.hits++; g.inv = 1; g.slow = .45; g.flash = .4;
        if (g.hits >= o.lives) { g.status = 'lose'; g.why = `Te caíste ${o.lives} veces.`; }
      }
    }
    if (g.status === 'play' && g.d >= o.goal) { g.d = o.goal; g.status = 'win'; }
  };
  g.hud = () => ({ l: `${Math.floor(g.d)} / ${o.goal} m`, r: 'Vidas ' + '●'.repeat(Math.max(0, o.lives - g.hits)) + '○'.repeat(Math.min(o.lives, g.hits)), p: g.d / o.goal, rlabel: 1 });
  g.state = () => ({ d: g.d, lane: g.lane, x: g.x, obs: obs.filter(b => !b.hit && b.d > g.d - 1 && b.d < g.d + 16).map(b => ({ dd: b.d - g.d, lane: b.lane })) });
  g.draw = (c, W, H, T) => {
    const py = H * .8, ppm = H * .8 / 22, roadW = Math.min(W * .84, 420), lw = roadW / 3, x0 = (W - roadW) / 2;
    const sy = d => py - (d - g.d) * ppm;
    c.fillStyle = '#0f1d13'; c.fillRect(0, 0, W, H);
    const st = 4 * ppm, so = (g.d * ppm) % (st * 2);
    c.fillStyle = '#132518'; for (let y = -st * 2 + so; y < H; y += st * 2) c.fillRect(0, y, W, st);
    c.fillStyle = '#2a2f2c'; c.fillRect(x0 - 10, 0, roadW + 20, H);
    c.fillStyle = '#1f2321'; c.fillRect(x0, 0, roadW, H);
    for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,255,.03)'; c.fillRect(x0 + hash(i * 3.1) * roadW, (i * 53 + g.d * ppm) % H, 2, 2); }
    c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x0 + 4, 0, 3, H); c.fillRect(x0 + roadW - 7, 0, 3, H);
    const dl = 3 * ppm, doff = (g.d * ppm) % (dl * 2);
    c.fillStyle = 'rgba(255,255,255,.45)';
    for (let k = 1; k < 3; k++) for (let y = -dl * 2 + doff; y < H; y += dl * 2) c.fillRect(x0 + lw * k - 1.5, y, 3, dl);
    // meta con el logo
    const fy = sy(o.goal);
    if (fy > -120 && fy < H + 40) {
      const sq = roadW / 18;
      for (let i = 0; i < 18; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#eee'; c.fillRect(x0 + i * sq, fy + j * sq, sq, sq); }
      c.fillStyle = C.ink; rr(c, x0 - 16, fy - lw * .55, roadW + 32, lw * .42, 8); c.fill();
      c.strokeStyle = C.green; c.lineWidth = 2; c.stroke();
      drawBall(c, W / 2, fy - lw * .34, lw * .26, 0, false);
      text(c, 'META', x0 + lw * .45, fy - lw * .34, lw * .2, '#fff'); text(c, 'COZY', x0 + roadW - lw * .45, fy - lw * .34, lw * .2, C.hi);
    }
    for (const ob of obs) {
      const y = sy(ob.d); if (y < -40 || y > H + 40) continue;
      const x = x0 + lw * (ob.lane + .5);
      if (ob.k === 'hole') {
        c.fillStyle = '#0a0c0b'; c.beginPath(); c.ellipse(x, y, lw * .24, lw * .14, ob.s - .5, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, lw * .26, lw * .16, ob.s - .5, Math.PI * .1, Math.PI * 1.1); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.ellipse(x - lw * .05, y + lw * .03, lw * .1, lw * .05, ob.s, 0, TAU); c.fill();
      } else {
        const r = lw * .13;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x + r * .4, y + r * .5, r * 1.3, r * .8, 0, 0, TAU); c.fill();
        c.fillStyle = '#d65d1a'; rr(c, x - r * 1.15, y - r * 1.15, r * 2.3, r * 2.3, r * .4); c.fill();
        c.fillStyle = '#ff7a1a'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = r * .32; c.beginPath(); c.arc(x, y, r * .6, 0, TAU); c.stroke();
        c.fillStyle = '#ffb27a'; c.beginPath(); c.arc(x, y, r * .25, 0, TAU); c.fill();
      }
    }
    // ciclista (vista de arriba)
    const bx = x0 + lw * (g.x + .5), s = Math.min(lw * .5, H * .12);
    if (!(g.inv > 0 && Math.floor(T * 12) % 2)) {
      c.save(); c.translate(bx, py); c.rotate(clamp(g.tilt, -.35, .35));
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(s * .08, s * .12, s * .3, s * .95, 0, 0, TAU); c.fill();
      c.fillStyle = '#050605'; rr(c, -s * .05, s * .25, s * .1, s * .6, s * .05); c.fill(); rr(c, -s * .05, -s * .95, s * .1, s * .6, s * .05); c.fill();
      c.strokeStyle = '#8d938f'; c.lineWidth = s * .06; line(c, 0, -s * .6, 0, s * .5);
      c.strokeStyle = '#c8ccc8'; c.lineWidth = s * .07; c.lineCap = 'round'; line(c, -s * .26, -s * .62, s * .26, -s * .62);
      c.strokeStyle = C.paper2; c.lineWidth = s * .1; line(c, -s * .2, -s * .18, -s * .24, -s * .58); line(c, s * .2, -s * .18, s * .24, -s * .58);
      c.fillStyle = C.green; c.beginPath(); c.ellipse(0, 0, s * .25, s * .36, 0, 0, TAU); c.fill();
      c.fillStyle = C.deep; c.fillRect(-s * .04, -s * .3, s * .08, s * .6);
      c.fillStyle = '#1b201d'; c.beginPath(); c.ellipse(0, s * .32, s * .2, s * .14, 0, 0, TAU); c.fill();
      c.fillStyle = C.paper; c.beginPath(); c.ellipse(0, -s * .3, s * .14, s * .17, 0, 0, TAU); c.fill();
      c.fillStyle = C.ink; c.fillRect(-s * .025, -s * .46, s * .05, s * .3);
      c.restore();
    }
    if (g.flash > 0) { c.fillStyle = `rgba(255,80,60,${g.flash * .3})`; c.fillRect(0, 0, W, H); }
  };
  return g;
}

/* ---------- FÚTBOL: penales contra un arquero que se mueve ---------- */
function makeFoot() {
  const SHOTS = 5, NEED = 3;
  const g = { id: 'foot', status: 'play', t: 0, goals: 0, shots: 0, kx: 0, kph: Math.random() * 6, kspd: 1.7, kchg: 1.5, aim: { x: .5, y: .55 }, aimOn: false, sh: null, msg: '', msgT: 0, dive: 0, dd: 0, why: '', log: [] };
  let G = null; const held = {};
  g.controls = [{ hint: 'Tocá el arco donde quieras patear' }];
  g.help = { kb: [['Mouse', 'Apuntá y hacé clic para patear'], ['← → ↑ ↓', 'Mové la mira'], ['Espacio', 'Patear']], touch: [['Tocar', 'Tocá el lugar del arco donde querés patear']], goal: `Hacé ${NEED} goles en ${SHOTS} penales. Pateá lejos del arquero.` };
  const geo = (W, H) => {
    const gw = Math.min(W * .84, H * 1.25, 560), gh = gw * .36, gx = (W - gw) / 2;
    const dist = Math.max(gw * .62, Math.min(H * .42, gw * 1.1)), gy = Math.max(H * .13, 52, (H - gh - dist) * .42), gl = gy + gh;
    const spot = [W / 2, Math.min(H - 40, gl + dist)];
    return { gw, gh, gx, gy, gl, spot, br: Math.max(14, gw * .045) };
  };
  const clampAim = (x, y) => ({ x: clamp(x, .07, .93), y: clamp(y, .14, .88) });
  const shoot = () => {
    if (g.status !== 'play' || g.sh || g.shots >= SHOTS) return;
    g.sh = { t: 0, T: .6, tx: g.aim.x, ty: g.aim.y, res: null, end: 0 }; g.shots++;
  };
  g.press = a => { if (a === 'a') shoot(); else { held[a] = true; g.aimOn = true; } };
  g.release = a => { held[a] = false; };
  g.move = (x, y, W, H, type) => { if (type !== 'mouse' || !G) return; g.aim = clampAim((x - G.gx) / G.gw, (y - G.gy) / G.gh); g.aimOn = true; };
  g.tap = (x, y) => { if (!G) return; g.aim = clampAim((x - G.gx) / G.gw, (y - G.gy) / G.gh); g.aimOn = true; shoot(); };
  g.update = dt => {
    g.t += dt; if (g.msgT > 0) g.msgT -= dt;
    const m = dt * .9;
    if (held.left) g.aim.x -= m; if (held.right) g.aim.x += m; if (held.up) g.aim.y -= m * 1.4; if (held.down) g.aim.y += m * 1.4;
    g.aim = clampAim(g.aim.x, g.aim.y);
    const s = g.sh;
    if (!s || s.t < .18) {   // patrulla de lado a lado con ritmo cambiante
      g.kchg -= dt; if (g.kchg <= 0) { g.kchg = .9 + Math.random() * 1.2; g.kspd = 1.2 + Math.random() * 1.3; }
      g.kph += dt * g.kspd; g.kx = Math.sin(g.kph) * .34;
    }
    if (!s) return;
    s.t += dt;
    const tx = s.tx - .5;
    if (s.t > .18 && !s.res) {   // reacción del arquero: velocidad limitada
      if (!g.dd) g.dd = Math.sign(tx - g.kx) || 1;
      g.kx += clamp(tx - g.kx, -dt * .55, dt * .55);
      if (Math.abs(tx - g.kx) < .25) g.dive = Math.min(1, g.dive + dt * 4);
    }
    if (s.t >= s.T && !s.res) {
      const dist = Math.abs(tx - g.kx), reach = .12 + g.dive * .08;
      s.res = (dist < reach && !(s.ty < .24 && dist > .07)) ? 'save' : 'goal';
      if (s.res === 'goal') { g.goals++; g.msg = '¡GOL!'; } else g.msg = 'ATAJÓ';
      g.log.push(s.res); g.msgT = 1.1;
    }
    if (s.res) {
      s.end += dt;
      if (s.end > 1.1) {
        g.sh = null; g.dive = 0; g.dd = 0;
        if (g.goals >= NEED) g.status = 'win';
        else if (g.goals + (SHOTS - g.shots) < NEED) { g.status = 'lose'; g.why = `Hiciste ${g.goals} de ${NEED} goles.`; }
      }
    }
  };
  g.hud = () => ({ l: `Goles ${g.goals} / ${NEED}`, r: `Penal ${Math.min(SHOTS, g.shots + (g.sh ? 0 : 1))} / ${SHOTS}`, p: g.goals / NEED });
  g.state = () => ({ kx: g.kx, busy: !!g.sh, G, goals: g.goals, shots: g.shots });
  g.draw = (c, W, H, T) => {
    G = geo(W, H); const { gw, gh, gx, gy, gl, spot, br } = G;
    const ab = gy + gh * .45;
    const bg = c.createLinearGradient(0, 0, 0, ab); bg.addColorStop(0, '#0b0c0b'); bg.addColorStop(1, '#161a18'); c.fillStyle = bg; c.fillRect(0, 0, W, ab);
    for (let r = 0; r < 6; r++) for (let i = 0; i < W / 9; i++) { const h = hash(i * 13 + r * 71); if (h < .3) continue; c.fillStyle = h > .95 ? 'rgba(46,229,102,.5)' : `rgba(255,255,255,${.04 + h * .07})`; c.fillRect(i * 9 + (r % 2) * 4, 8 + r * (ab - gh * .25) / 6, 4, 4); }
    c.fillStyle = C.ink; c.fillRect(0, ab - gh * .22, W, gh * .22);
    const bw = Math.max(150, gw * .42), sh2 = reduce ? 0 : (T * 14) % bw;
    for (let i = -1; i < W / bw + 1; i++) { const x = i * bw + sh2, hl = ((i % 2) + 2) % 2 === 0; c.fillStyle = hl ? C.green : '#141715'; c.fillRect(x + 2, ab - gh * .2, bw - 4, gh * .17); text(c, 'COZY SPORT', x + bw / 2, ab - gh * .115, Math.max(10, gh * .1), hl ? '#fff' : '#d5d8d5'); }
    const stp = (H - ab) / 7;
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#123b1d' : '#154421'; c.fillRect(0, ab + i * stp, W, stp + 1); }
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    line(c, 0, gl, W, gl);
    c.beginPath(); c.moveTo(gx - gw * .18, gl); c.lineTo(gx - gw * .28, gl + gh * .55); c.lineTo(gx + gw * 1.28, gl + gh * .55); c.lineTo(gx + gw * 1.18, gl); c.stroke();
    c.beginPath(); c.moveTo(W / 2 - gw * .95, gl); c.lineTo(W / 2 - gw * 1.25, H); c.moveTo(W / 2 + gw * .95, gl); c.lineTo(W / 2 + gw * 1.25, H); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(spot[0], spot[1] + br * .3, 5, 2.5, 0, 0, TAU); c.fill();
    // arco y red
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(gx, gy, gw, gh);
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1;
    const n = gw / 18;
    for (let x = gx; x <= gx + gw + .5; x += n) line(c, x, gy, x, gl);
    for (let y = gy; y <= gl + .5; y += n) line(c, gx, y, gx + gw, y);
    c.strokeStyle = C.paper; c.lineWidth = Math.max(4, gw * .016); c.lineCap = 'square';
    c.beginPath(); c.moveTo(gx, gl); c.lineTo(gx, gy); c.lineTo(gx + gw, gy); c.lineTo(gx + gw, gl); c.stroke();
    // arquero de frente
    const kh = gh * .82, kx = W / 2 + g.kx * gw;
    c.save(); c.translate(kx, gl); c.rotate(g.dd * g.dive * 1.0); c.lineCap = 'round';
    c.strokeStyle = '#2a302d'; c.lineWidth = kh * .11;
    line(c, -kh * .09, -kh * .45, -kh * .19, -kh * .03); line(c, kh * .09, -kh * .45, kh * .19, -kh * .03);
    c.strokeStyle = C.hi; c.lineWidth = kh * .1; line(c, -kh * .19, -kh * .03, -kh * .27, -kh * .02); line(c, kh * .19, -kh * .03, kh * .27, -kh * .02);
    const ar = reduce ? 0 : Math.sin(T * 7) * .05;
    c.strokeStyle = C.paper2; c.lineWidth = kh * .09;
    line(c, -kh * .17, -kh * .8, -kh * .42, -kh * (1.0 + ar)); line(c, kh * .17, -kh * .8, kh * .42, -kh * (1.0 - ar));
    c.fillStyle = C.hi; c.beginPath(); c.arc(-kh * .44, -kh * (1.03 + ar), kh * .075, 0, TAU); c.fill(); c.beginPath(); c.arc(kh * .44, -kh * (1.03 - ar), kh * .075, 0, TAU); c.fill();
    c.fillStyle = '#1e2421'; rr(c, -kh * .19, -kh * .52, kh * .38, kh * .14, kh * .04); c.fill();
    c.fillStyle = C.paper2; rr(c, -kh * .2, -kh * .9, kh * .4, kh * .42, kh * .08); c.fill();
    text(c, '1', 0, -kh * .69, kh * .2, C.ink);
    c.fillStyle = C.paper2; c.beginPath(); c.arc(0, -kh * 1.0, kh * .1, 0, TAU); c.fill();
    c.restore();
    // pelota (logo)
    let bx = spot[0], by = spot[1], r = br, rot = 0;
    if (g.sh) {
      const s = g.sh, tx = gx + s.tx * gw, ty = gy + s.ty * gh, k = Math.min(1, s.t / s.T), e = 1 - (1 - k) * (1 - k);
      bx = lerp(spot[0], tx, e); by = lerp(spot[1], ty, e) - Math.sin(k * Math.PI) * gh * .25; r = lerp(br, br * .55, e); rot = k * 9;
      if (s.res === 'save') { const q = Math.min(1, s.end * 2); bx = tx + (tx < kx ? -1 : 1) * q * gw * .3; by = ty - q * gh * .3 + q * q * gh * .9; }
      if (s.res === 'goal') by = ty + Math.min(1, s.end * 3) * gh * .1;
    }
    drawBall(c, bx, by, r, rot);
    if (!g.sh && g.aimOn) {
      const ax = gx + g.aim.x * gw, ay = gy + g.aim.y * gh;
      c.strokeStyle = C.hi; c.lineWidth = 2; c.beginPath(); c.arc(ax, ay, br * .8, 0, TAU); c.stroke();
      line(c, ax - br * 1.3, ay, ax - br * .45, ay); line(c, ax + br * .45, ay, ax + br * 1.3, ay); line(c, ax, ay - br * 1.3, ax, ay - br * .45); line(c, ax, ay + br * .45, ax, ay + br * 1.3);
    }
    for (let i = 0; i < SHOTS; i++) {
      const x = W / 2 + (i - 2) * 18, y = H - 14, res = g.log[i];
      c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fillStyle = res === 'goal' ? C.hi : res === 'save' ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.14)'; c.fill();
    }
    if (g.msgT > 0) { c.globalAlpha = Math.min(1, g.msgT * 3); text(c, g.msg, W / 2, gl + (spot[1] - gl) * .45, Math.min(W * .16, 84), g.msg === 'ATAJÓ' ? C.paper : C.hi); c.globalAlpha = 1; }
  };
  return g;
}

/* ---------- FOOTGOLF: dirección + fuerza, embocar la pelota-logo ---------- */
function makeGolf() {
  const MAXS = 3, AR = .72, L = 1 / AR;  // cancha: ancho 1, alto L
  const tee = [.5, L - .16], hole = [.64, .3], HR = .045, BR = .03;
  const bunkers = [[.27, .8, .16, .09], [.87, .5, .09, .07]], trees = [[.13, .4, .085], [.9, L - .3, .075], [.17, L - .48, .06]];
  const D = Math.hypot(tee[0] - hole[0], tee[1] - hole[1]);
  const VMAX = 2 * 1.4 * D / 1.8, ACC = VMAX / 1.8;
  const g = { id: 'golf', status: 'play', t: 0, b: [...tee], v: [0, 0], ph: 'aim', ang: 0, pw: 0, at: 0, strokes: 0, rot: 0, sink: 0, why: '', base: 0 };
  g.controls = [{ a: 'a', label: 'Patear', key: 'Espacio', main: true }];
  g.help = { kb: [['Espacio / clic', '1º: fijá la dirección'], ['Espacio / clic', '2º: fijá la fuerza']], touch: [['Patear', '1º toque fija la dirección, 2º la fuerza']], goal: `Embocá la pelota en el hoyo en ${MAXS} golpes como máximo.` };
  const toHole = () => Math.atan2(hole[1] - g.b[1], hole[0] - g.b[0]);
  g.base = toHole();
  g.press = a => {
    if (a !== 'a' || g.status !== 'play') return;
    if (g.ph === 'aim') { g.ph = 'power'; g.at = 0; }
    else if (g.ph === 'power') { const p = Math.max(.04, g.pw); g.v = [Math.cos(g.ang) * VMAX * p, Math.sin(g.ang) * VMAX * p]; g.ph = 'roll'; g.strokes++; }
  };
  g.tap = () => g.press('a');
  const inEl = (x, y, e) => ((x - e[0]) / e[2]) ** 2 + ((y - e[1]) / e[3]) ** 2 < 1;
  g.update = dt => {
    g.t += dt; g.at += dt;
    if (g.ph === 'aim') g.ang = g.base + .5 * Math.sin(g.at * 1.7);
    else if (g.ph === 'power') { const k = (g.at / .8) % 2; g.pw = k < 1 ? k : 2 - k; }
    else if (g.ph === 'roll') {
      let sp = Math.hypot(g.v[0], g.v[1]);
      const dh = Math.hypot(hole[0] - g.b[0], hole[1] - g.b[1]);
      if (dh < HR && sp < 1.05) { g.ph = 'sink'; g.sink = 0; return; }
      if (dh < HR * 2.4 && sp < 1.2 && dh > 1e-4) { const f = (1 - dh / (HR * 2.4)) * 3 * dt; g.v[0] += (hole[0] - g.b[0]) / dh * f; g.v[1] += (hole[1] - g.b[1]) / dh * f; }
      const sand = bunkers.some(e => inEl(g.b[0], g.b[1], e));
      const dec = ACC * (sand ? 5 : 1) * dt;
      sp = Math.hypot(g.v[0], g.v[1]);
      if (sp <= dec) { g.v = [0, 0]; sp = 0; } else { g.v[0] -= g.v[0] / sp * dec; g.v[1] -= g.v[1] / sp * dec; }
      g.b[0] += g.v[0] * dt; g.b[1] += g.v[1] * dt; g.rot += sp * dt * 30;
      if (g.b[0] < BR) { g.b[0] = BR; g.v[0] = Math.abs(g.v[0]) * .5; } if (g.b[0] > 1 - BR) { g.b[0] = 1 - BR; g.v[0] = -Math.abs(g.v[0]) * .5; }
      if (g.b[1] < BR) { g.b[1] = BR; g.v[1] = Math.abs(g.v[1]) * .5; } if (g.b[1] > L - BR) { g.b[1] = L - BR; g.v[1] = -Math.abs(g.v[1]) * .5; }
      for (const t of trees) {
        const dx = g.b[0] - t[0], dy = g.b[1] - t[1], d = Math.hypot(dx, dy) || 1e-4, m = t[2] + BR;
        if (d < m) { const nx = dx / d, ny = dy / d, vn = g.v[0] * nx + g.v[1] * ny; g.b = [t[0] + nx * m, t[1] + ny * m]; if (vn < 0) { g.v[0] -= 1.6 * vn * nx; g.v[1] -= 1.6 * vn * ny; } }
      }
      if (sp === 0) {
        if (g.strokes >= MAXS) { g.status = 'lose'; g.why = `No entró en ${MAXS} golpes.`; }
        else { g.ph = 'aim'; g.at = 0; g.base = toHole(); }
      }
    } else if (g.ph === 'sink') {
      g.sink += dt; g.b[0] = lerp(g.b[0], hole[0], .3); g.b[1] = lerp(g.b[1], hole[1], .3);
      if (g.sink > .55) g.status = 'win';
    }
  };
  g.hud = () => ({ l: `Golpe ${Math.min(MAXS, g.strokes + (g.ph === 'roll' || g.ph === 'sink' ? 0 : 1))} / ${MAXS}`, r: g.ph === 'aim' ? 'Fijá la dirección' : g.ph === 'power' ? 'Fijá la fuerza' : '', p: g.strokes / MAXS });
  g.state = () => ({ ph: g.ph, ang: g.ang, base: g.base, pw: g.pw, d: Math.hypot(hole[0] - g.b[0], hole[1] - g.b[1]), D, VMAX, ACC, strokes: g.strokes });
  g.draw = (c, W, H, T) => {
    const pad = 10, cw = Math.max(40, Math.min(W - pad * 2, (H - pad * 2) * AR)), s = cw, ox = (W - cw) / 2, oy = (H - L * s) / 2;
    const P = (x, y) => [ox + x * s, oy + y * s];
    c.fillStyle = '#0c1f13'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.02)'; c.lineWidth = 6;
    for (let i = 0; i < W + H; i += 18) line(c, i, 0, i - H, H);
    c.save(); rr(c, ox, oy, cw, L * s, 22); c.clip();
    c.fillStyle = '#16451f'; c.fillRect(ox, oy, cw, L * s);
    const sw = cw / 7; c.fillStyle = 'rgba(255,255,255,.03)'; for (let i = 0; i < 7; i += 2) c.fillRect(ox + i * sw, oy, sw, L * s);
    const [hx, hy] = P(...hole);
    const gr = c.createRadialGradient(hx, hy, 0, hx, hy, .26 * s); gr.addColorStop(0, '#20702f'); gr.addColorStop(.85, '#1c5f2a'); gr.addColorStop(1, 'rgba(28,95,42,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(hx, hy, .26 * s, 0, TAU); c.fill();
    for (const e of bunkers) { const [x, y] = P(e[0], e[1]); c.fillStyle = '#b3a173'; c.beginPath(); c.ellipse(x, y, e[2] * s, e[3] * s, -.2, 0, TAU); c.fill(); c.fillStyle = '#cbbb8f'; c.beginPath(); c.ellipse(x - e[2] * s * .06, y - e[3] * s * .1, e[2] * s * .82, e[3] * s * .72, -.2, 0, TAU); c.fill(); }
    const [tx, ty] = P(...tee); c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, tx - .08 * s, ty - .045 * s, .16 * s, .09 * s, 6); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; rr(c, ox, oy, cw, L * s, 22); c.stroke();
    for (const t of trees) { const [x, y] = P(t[0], t[1]), r = t[2] * s; c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + r * .25, y + r * .3, r, 0, TAU); c.fill(); c.fillStyle = '#0e3318'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = '#17482a'; c.beginPath(); c.arc(x - r * .25, y - r * .25, r * .55, 0, TAU); c.fill(); }
    // hoyo + bandera con el logo
    c.fillStyle = '#050605'; c.beginPath(); c.arc(hx, hy, HR * s, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy, HR * s, Math.PI * .1, Math.PI * .9); c.stroke();
    const fh = .2 * s, wv = reduce ? 0 : Math.sin(T * 3) * .05;
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 3; line(c, hx, hy, hx + fh * .5, hy + fh * .15);
    c.strokeStyle = C.paper; c.lineWidth = 3; line(c, hx, hy, hx, hy - fh);
    c.fillStyle = C.green; c.beginPath(); c.moveTo(hx, hy - fh); c.quadraticCurveTo(hx + fh * .3, hy - fh * (1.03 + wv), hx + fh * .62, hy - fh * .95); c.lineTo(hx + fh * .62, hy - fh * .62); c.quadraticCurveTo(hx + fh * .3, hy - fh * (.67 - wv), hx, hy - fh * .64); c.fill();
    drawZ(c, hx + fh * .31, hy - fh * .81, fh * .34, '#fff');
    const [bx, by] = P(...g.b), br = BR * s * (g.ph === 'sink' ? Math.max(.2, 1 - g.sink * 1.5) : 1);
    if (g.ph === 'aim' || g.ph === 'power') {
      const len = .3 * s, ex = bx + Math.cos(g.ang) * len, ey = by + Math.sin(g.ang) * len;
      c.strokeStyle = g.ph === 'power' ? C.hi : 'rgba(255,255,255,.85)'; c.lineWidth = 2.5; c.setLineDash([5, 7]); c.lineDashOffset = reduce ? 0 : -T * 20;
      line(c, bx, by, ex, ey); c.setLineDash([]);
      c.fillStyle = g.ph === 'power' ? C.hi : '#fff'; c.beginPath(); c.moveTo(ex + Math.cos(g.ang) * 10, ey + Math.sin(g.ang) * 10); c.lineTo(ex + Math.cos(g.ang + 2.5) * 9, ey + Math.sin(g.ang + 2.5) * 9); c.lineTo(ex + Math.cos(g.ang - 2.5) * 9, ey + Math.sin(g.ang - 2.5) * 9); c.fill();
    }
    drawBall(c, bx, by, br, g.rot, g.ph !== 'sink');
    if (g.ph === 'power' || g.ph === 'aim') {
      const mh = Math.min(L * s * .45, 220), mw = 12, mx = Math.min(W - 30, ox + cw + 12 < W - 30 ? ox + cw + 14 : ox + cw - 28), my = oy + L * s * .5 - mh / 2;
      c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, mx - 4, my - 4, mw + 8, mh + 8, 10); c.fill();
      const fg = c.createLinearGradient(0, my + mh, 0, my); fg.addColorStop(0, C.deep); fg.addColorStop(1, C.hi);
      const p = g.ph === 'power' ? g.pw : 0; c.fillStyle = fg; rr(c, mx, my + mh * (1 - p), mw, mh * p, 6); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; rr(c, mx, my, mw, mh, 6); c.stroke();
      text(c, 'FUERZA', mx + mw / 2, my + mh + 16, 10, 'rgba(255,255,255,.6)', 'center', FM, 700);
    }
  };
  return g;
}

/* ---------- AGUAS ABIERTAS: brazadas alternadas hasta la boya ---------- */
function makeSwim(o = {}) {
  o = Object.assign({ goal: 100, limit: 28 }, o);
  const g = { id: 'swim', status: 'play', t: 0, d: 0, v: 0, last: '', armL: 0, armR: 0, msg: 0, why: '', splash: [] };
  g.controls = [{ a: 'left', label: 'Brazada izq.', key: '← / A', main: true }, { a: 'right', label: 'Brazada der.', key: '→ / D', main: true }];
  g.help = { kb: [['← / A', 'Brazada izquierda'], ['→ / D', 'Brazada derecha']], touch: [['Izq. / Der.', 'Tocá alternando los dos botones']], goal: `Nadá ${o.goal} m en menos de ${o.limit} s. Alterná los brazos: si repetís el mismo, perdés ritmo.` };
  g.press = a => {
    if (g.status !== 'play' || (a !== 'left' && a !== 'right')) return;
    if (a === g.last) { g.v *= .55; g.msg = .9; } else g.v = Math.min(6.5, g.v + .85);
    g.last = a; if (a === 'left') g.armL = 1; else g.armR = 1;
    if (!reduce) g.splash.push({ x: a === 'left' ? -1 : 1, t: 0 });
  };
  g.tap = (x, y, W) => g.press(x < W / 2 ? 'left' : 'right');
  g.update = dt => {
    g.t += dt; g.v -= g.v * .7 * dt; g.d += g.v * dt;
    g.armL = Math.max(0, g.armL - dt * 2.6); g.armR = Math.max(0, g.armR - dt * 2.6); if (g.msg > 0) g.msg -= dt;
    g.splash.forEach(s => s.t += dt); g.splash = g.splash.filter(s => s.t < .6);
    if (g.d >= o.goal) { g.d = o.goal; g.status = 'win'; }
    else if (g.t >= o.limit) { g.status = 'lose'; g.why = 'Se terminó el tiempo antes de la boya final.'; }
  };
  g.hud = () => ({ l: `${Math.floor(g.d)} / ${o.goal} m`, r: fmt(o.limit - g.t), p: g.d / o.goal, warn: o.limit - g.t < 4 });
  g.state = () => ({ d: g.d, v: g.v, last: g.last });
  g.draw = (c, W, H, T) => {
    const py = H * .7, ppm = H * .7 / 13, sy = d => py - (d - g.d) * ppm, cx = W / 2;
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a2229'); bg.addColorStop(1, '#0d3340'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 2;
    const gap = 1.6 * ppm, o0 = (g.d * ppm) % gap, k0 = Math.floor(g.d / 1.6);
    for (let y = -gap + o0, k = k0 + 1; y < H + gap; y += gap, k--) {
      c.beginPath(); const ph = k * 1.7 + (reduce ? 0 : T * 1.2);
      for (let x = 0; x <= W + 16; x += 16) { const yy = y + Math.sin(x * .025 + ph) * 4; x ? c.lineTo(x, yy) : c.moveTo(x, yy); }
      c.stroke();
    }
    const bxo = Math.min(W * .34, 170), br = Math.max(10, ppm * .32);
    for (let m = 25; m < o.goal; m += 25) {
      const y = sy(m); if (y < -40 || y > H + 40) continue;
      for (const sd of [-1, 1]) { const x = cx + sd * bxo; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 3, y + 4, br, br * .6, 0, 0, TAU); c.fill(); c.fillStyle = '#f07a24'; c.beginPath(); c.arc(x, y, br, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - br * .3, y - br * .3, br * .3, 0, TAU); c.fill(); }
      text(c, m + ' m', cx + bxo - br - 8, y, 12, 'rgba(255,255,255,.65)', 'right', FM, 700);
    }
    const fy = sy(o.goal);
    if (fy > -100 && fy < H + 60) {
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.setLineDash([3, 6]); line(c, cx - bxo, fy, cx + bxo, fy); c.setLineDash([]);
      for (const sd of [-1, 1]) { c.fillStyle = C.green; c.beginPath(); c.arc(cx + sd * bxo, fy, Math.max(14, ppm * .45), 0, TAU); c.fill(); }
      drawBall(c, cx, fy - ppm * .2, Math.max(18, ppm * .55), reduce ? 0 : Math.sin(T * 2) * .1);
      text(c, 'LLEGADA', cx, fy - ppm * .2 - Math.max(18, ppm * .55) - 14, 13, '#fff', 'center', FM, 700);
    }
    const s = Math.max(22, Math.min(ppm * 1.05, 70));
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2;
    line(c, cx - s * .25, py + s * 1.1, cx - s * .8, py + s * 3); line(c, cx + s * .25, py + s * 1.1, cx + s * .8, py + s * 3);
    c.save(); c.translate(cx, py); c.rotate(reduce ? 0 : Math.sin(g.t * 6) * .03 * Math.min(1, g.v)); c.lineCap = 'round';
    const kick = Math.sin(g.t * 18) * (g.v > .5 ? 1 : .2);
    c.strokeStyle = '#1a201d'; c.lineWidth = s * .13; line(c, -s * .08, s * .5, -s * .1 + kick * s * .04, s * 1.0); line(c, s * .08, s * .5, s * .1 - kick * s * .04, s * 1.0);
    if (g.v > .6) { c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(0, s * 1.12, s * .22, s * .12, 0, 0, TAU); c.fill(); }
    const arm = (sd, k) => { const ang = lerp(.15, 2.8, k), len = s * .62; c.strokeStyle = '#d7d8d4'; c.lineWidth = s * .11; line(c, sd * s * .2, -s * .22, sd * s * .2 + sd * Math.sin(ang) * len * .45, -s * .22 - Math.cos(ang) * len); };
    arm(-1, g.armL); arm(1, g.armR);
    c.fillStyle = '#141917'; rr(c, -s * .22, -s * .3, s * .44, s * .86, s * .2); c.fill();
    c.fillStyle = C.green; c.fillRect(-s * .22, -s * .08, s * .44, s * .06);
    c.fillStyle = C.green; c.beginPath(); c.ellipse(0, -s * .44, s * .14, s * .17, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.fillRect(-s * .1, -s * .47, s * .2, s * .035);
    c.restore();
    for (const sp of g.splash) { const a = 1 - sp.t / .6; c.strokeStyle = `rgba(255,255,255,${a * .5})`; c.lineWidth = 2; c.beginPath(); c.arc(cx + sp.x * s * .3, py - s * .8, s * .1 + sp.t * s * .5, 0, TAU); c.stroke(); }
    if (g.msg > 0) { c.globalAlpha = Math.min(1, g.msg * 2); rr(c, cx - 100, py - s * 1.6 - 18, 200, 36, 18); c.fillStyle = 'rgba(11,12,11,.82)'; c.fill(); text(c, '¡ALTERNÁ LOS BRAZOS!', cx, py - s * 1.6, 15, C.hi); c.globalAlpha = 1; }
  };
  return g;
}

/* ---------- TRIATLÓN: natación + bici + running, versiones cortas ---------- */
function makeTri() {
  const st = [
    { n: 'Natación', f: () => makeSwim({ goal: 40, limit: 14 }) },
    { n: 'Ciclismo', f: () => makeBike({ goal: 160, lives: 3, v0: 13, v1: 17 }) },
    { n: 'Running', f: () => makeRun({ goal: 50, limit: 11, hurdles: [18, 34] }) }
  ];
  const g = { id: 'tri', status: 'play', i: 0, ch: st[0].f(), tr: 0, why: '' };
  Object.defineProperty(g, 'controls', { get: () => g.tr > 0 ? [{ hint: 'Transición…' }] : g.ch.controls });
  g.help = { kb: [['Natación', '← → alternando'], ['Ciclismo', '← → para cambiar de carril'], ['Running', 'Espacio para correr · ↑ para saltar']], touch: [['Natación', 'Izq. / Der. alternando'], ['Ciclismo', '◀ ▶ para cambiar de carril'], ['Running', 'Correr rápido · Saltar las vallas']], goal: 'Tres etapas cortas, una atrás de la otra. Completá las tres.' };
  g.press = a => { if (g.tr <= 0) g.ch.press(a); };
  g.release = a => { if (g.ch.release) g.ch.release(a); };
  g.tap = (x, y, W, H) => { if (g.tr <= 0 && g.ch.tap) g.ch.tap(x, y, W, H); };
  g.update = dt => {
    if (g.tr > 0) { g.tr -= dt; if (g.tr <= 0) { g.i++; g.ch = st[g.i].f(); } return; }
    g.ch.update(dt);
    if (g.ch.status === 'lose') { g.status = 'lose'; g.why = `${st[g.i].n}: ${g.ch.why}`; }
    else if (g.ch.status === 'win') { if (g.i === st.length - 1) g.status = 'win'; else g.tr = 1.3; }
  };
  g.hud = () => { const h = g.ch.hud(); return Object.assign({}, h, { stage: `${g.i + 1}/3 ${st[g.i].n}`, p: (g.i + (g.tr > 0 ? 1 : h.p)) / 3 }); };
  g.state = () => Object.assign({ stage: g.i, tr: g.tr > 0, cid: g.ch.id }, g.ch.state());
  g.draw = (c, W, H, T) => {
    g.ch.draw(c, W, H, T);
    if (g.tr > 0) {
      c.fillStyle = 'rgba(11,12,11,.8)'; c.fillRect(0, 0, W, H);
      text(c, `ETAPA ${g.i + 2} DE 3`, W / 2, H / 2 - 34, 13, C.hi, 'center', FM, 700);
      text(c, st[g.i + 1].n.toUpperCase(), W / 2, H / 2 + 8, Math.min(W * .12, 56), '#fff');
    }
  };
  return g;
}

/* =============================================================
   INTERFAZ
   ============================================================= */
const ICONS = {
  run: '<path d="M4 20V9M20 20V9M3 9h18M3 12.5h18"/>',
  bike: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 9h6l3.5 7.5M9 9l3 7.5H5.5M13 6h2.5l2 3"/>',
  foot: '<circle cx="12" cy="12" r="9"/><path d="m12 8 3.2 2.3-1.2 3.8h-4l-1.2-3.8zM12 8V3M15.2 10.3l4.4-1.4M14 14.1l2.7 3.8M10 14.1l-2.7 3.8M8.8 10.3 4.4 8.9"/>',
  golf: '<path d="M8 20V3l9 3.8-9 3.8"/><ellipse cx="8" cy="20" rx="5" ry="1.6"/>',
  swim: '<circle cx="16" cy="6" r="2"/><path d="m5 11 4-3 3.5 2.5L16 9M2 15.5c2.5 0 2.5-1.8 5-1.8s2.5 1.8 5 1.8 2.5-1.8 5-1.8 2.5 1.8 5 1.8M2 20c2.5 0 2.5-1.8 5-1.8s2.5 1.8 5 1.8 2.5-1.8 5-1.8 2.5 1.8 5 1.8"/>',
  tri: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M10 2h4M12 2v3M18.5 6.5 20 5"/>'
};
const GAMES = [
  { id: 'run', name: 'Running', d: 'Corré los 100 m y saltá las vallas.', make: makeRun },
  { id: 'bike', name: 'Ciclismo', d: 'Esquivá pozos y conos en la ruta.', make: makeBike },
  { id: 'foot', name: 'Fútbol', d: 'Penales contra un arquero que se mueve.', make: makeFoot },
  { id: 'golf', name: 'Footgolf', d: 'Dirección y fuerza para embocarla.', make: makeGolf },
  { id: 'swim', name: 'Aguas abiertas', d: 'Brazadas alternadas hasta la boya.', make: makeSwim },
  { id: 'tri', name: 'Triatlón', d: 'Nadá, pedaleá y corré: tres etapas.', make: makeTri }
];
const KEYMAP = { ' ': 'a', Spacebar: 'a', Enter: 'a', ArrowUp: 'up', w: 'up', W: 'up', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'down', s: 'down', S: 'down' };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const pct = esc(CUPON.descuento);
const ARROW = '<svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-arrow"/></svg>';
const ARROWUP = '<svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-arrow-up"/></svg>';

const root = document.createElement('div');
root.className = 'cj'; root.hidden = true;
root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'cjTitle');
root.innerHTML = `
<div class="cj-box" tabindex="-1">
  <div class="cj-top">
    <div class="cj-brand"><svg class="wm" viewBox="0 0 3310 710" aria-hidden="true"><use href="#i-wordmark"/></svg><span class="sep"></span><span class="k">Ganate un cupón</span></div>
    <div class="cj-acts">
      <button class="cj-ghost cj-back" type="button" hidden><svg aria-hidden="true" viewBox="0 0 24 24" style="transform:scaleX(-1)"><use href="#i-arrow"/></svg>Volver</button>
      <button class="cj-ghost cj-skip" type="button" aria-label="Saltear e ir a la página (Esc)"><span class="lg">Saltear · Ir a la página</span><span class="sm">Saltear</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    </div>
  </div>
  <div class="cj-body">
    <section class="cj-scr cj-sel on" aria-label="Elegí tu disciplina">
      <h2 id="cjTitle">Elegí tu disciplina<br><em>y ganate un cupón</em></h2>
      <p class="sub">Cada deporte es un mini juego de unos 20 segundos. Si ganás, te llevás un cupón de <b>${pct} de descuento</b> para la tienda online.</p>
      <div class="cj-have" hidden><span>Ya ganaste tu cupón de <b>${pct}</b>. Podés seguir jugando por diversión.</span><button class="cj-ghost" type="button" data-act="ticket">Ver mi cupón</button></div>
      <div class="cj-grid">${GAMES.map((g, i) => `<button class="cj-card" type="button" data-g="${g.id}"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[g.id]}</svg></span><span class="n">0${i + 1}</span><span class="t">${g.name}</span><span class="d">${g.d}</span><span class="go">${ARROW}</span></button>`).join('')}</div>
      <p class="cj-foot">Un cupón por persona. <span class="cj-only-kb">Apretá Esc o “Saltear”</span><span class="cj-only-touch">Tocá “Saltear”</span> para ir directo a la página.</p>
    </section>
    <section class="cj-scr cj-play" aria-label="Juego">
      <div class="cj-stage"><canvas aria-label="Mini juego"></canvas>
        <div class="cj-card2 cj-intro"><div><p class="k">Cómo se juega</p><h3></h3><p class="goal"></p><ul></ul><button class="cj-btn wide" type="button" data-act="start">Empezar <span class="cj-only-kb" style="opacity:.75;font-weight:500">(Espacio)</span></button></div></div>
        <div class="cj-card2 cj-pause" hidden><div><p class="k">Pausa</p><h3>Juego en pausa</h3><p>Seguí cuando quieras.</p><br><button class="cj-btn wide" type="button" data-act="resume">Seguir jugando</button></div></div>
      </div>
      <div class="cj-ctrl"></div>
    </section>
    <section class="cj-scr cj-res" aria-live="polite"><div></div></section>
  </div>
</div>`;
document.body.appendChild(root);

const fab = document.createElement('button');
fab.type = 'button'; fab.className = 'cj-fab off';
document.body.appendChild(fab);

const $ = s => root.querySelector(s);
const scr = { sel: $('.cj-sel'), play: $('.cj-play'), res: $('.cj-res') };
const cv = $('canvas'), ctx = cv.getContext('2d'), stage = $('.cj-stage'), ctrl = $('.cj-ctrl'), intro = $('.cj-intro'), pauseC = $('.cj-pause'), back = $('.cj-back');
let W = 0, H = 0, dpr = 1, game = null, gdef = null, phase = 'idle', count = 0, endT = 0, raf = 0, last = 0, T = 0, ctrlKey = '', lastFocus = null, conf = [];

function setFab() {
  const t = getTicket();
  fab.innerHTML = `<span class="ball"><svg viewBox="50 100 412 312" aria-hidden="true"><use href="#i-z"/></svg></span>${t ? 'Tu cupón' : 'Ganate un cupón'} <span class="pct">${pct}</span>`;
  fab.setAttribute('aria-label', t ? `Ver tu cupón de ${CUPON.descuento}` : `Jugar y ganate un cupón de ${CUPON.descuento}`);
}
function show(k) {
  for (const n in scr) scr[n].classList.toggle('on', n === k);
  back.hidden = k === 'sel';
  if (k !== 'play') { stop(); if (k === 'sel') { phase = 'idle'; game = null; } }
}
function refreshSel() {
  const t = getTicket();
  $('.cj-have').hidden = !t;
  root.querySelectorAll('.cj-card').forEach(b => b.classList.toggle('won', !!t && t.disciplinaId === b.dataset.g));
}
function focusFirst() { const f = root.querySelector('.cj-scr.on button, .cj-scr.on a'); (f || $('.cj-box')).focus({ preventScroll: true }); }
function open(view) {
  lastFocus = document.activeElement;
  root.hidden = false; document.documentElement.classList.add('cj-lock');
  requestAnimationFrame(() => root.classList.add('open'));
  fab.classList.add('off');
  refreshSel();
  if (view === 'ticket' && getTicket()) showTicket(); else show('sel');
  setTimeout(focusFirst, 60);
}
function close() {
  if (root.hidden) return;
  ls.set(LS_VISTO, '1');
  stop(); phase = 'idle'; game = null;
  root.classList.remove('open'); document.documentElement.classList.remove('cj-lock');
  setTimeout(() => { if (!root.classList.contains('open')) root.hidden = true; }, reduce ? 200 : 450);
  setFab(); fab.classList.remove('off');
  if (lastFocus && lastFocus.focus && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
}

function resize() {
  const r = stage.getBoundingClientRect();
  dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(1, r.width); H = Math.max(1, r.height);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  if (game) draw();
}
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else addEventListener('resize', resize);

function renderCtrl() {
  const cs = game.controls, key = JSON.stringify(cs);
  if (key === ctrlKey) return; ctrlKey = key;
  ctrl.innerHTML = cs.map(c => c.hint ? `<div class="cj-hint">${esc(c.hint)}</div>` : `<button class="cj-key${c.main ? ' main' : ''}" type="button" data-a="${c.a}" tabindex="-1">${esc(c.label)}${c.key ? `<kbd>${esc(c.key)}</kbd>` : ''}</button>`).join('');
}
ctrl.addEventListener('pointerdown', e => {
  const b = e.target.closest('.cj-key'); if (!b) return; e.preventDefault();
  b.classList.add('on'); if (phase === 'play') game.press(b.dataset.a);
});
const upKey = e => { const b = e.target.closest && e.target.closest('.cj-key'); if (!b) return; b.classList.remove('on'); if (game && game.release) game.release(b.dataset.a); };
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => ctrl.addEventListener(t, upKey));
ctrl.addEventListener('contextmenu', e => e.preventDefault());

const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (phase === 'play' && game.tap) { const [x, y] = local(e); game.tap(x, y, W, H, e.pointerType); }
});
cv.addEventListener('pointermove', e => { if (phase === 'play' && game.move) { const [x, y] = local(e); game.move(x, y, W, H, e.pointerType); } });

function pick(id) {
  gdef = GAMES.find(g => g.id === id); if (!gdef) return;
  ls.set(LS_VISTO, '1');
  game = gdef.make(); ctrlKey = ''; conf = [];
  show('play'); phase = 'intro';
  intro.hidden = false; pauseC.hidden = true;
  const h = game.help;
  intro.querySelector('h3').textContent = gdef.name;
  intro.querySelector('.goal').textContent = h.goal;
  intro.querySelector('ul').innerHTML = h.kb.map(([k, t]) => `<li class="cj-only-kb"><kbd>${esc(k)}</kbd>${esc(t)}</li>`).join('') + h.touch.map(([k, t]) => `<li class="cj-only-touch"><kbd>${esc(k)}</kbd>${esc(t)}</li>`).join('');
  renderCtrl(); resize(); start();
  setTimeout(() => intro.querySelector('button').focus({ preventScroll: true }), 30);
}
function begin() {
  if (phase !== 'intro') return;
  intro.hidden = true; phase = 'count'; count = 2.4;
  $('.cj-box').focus({ preventScroll: true });
}
function start() { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); }
function stop() { cancelAnimationFrame(raf); raf = 0; }
function loop(ts) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, Math.max(0, (ts - last) / 1000)); last = ts; T += dt;
  if (!game) return stop();
  if (phase === 'count') { count -= dt; if (count <= 0) phase = 'play'; }
  else if (phase === 'play') {
    game.update(dt); renderCtrl();
    if (game.status !== 'play') { phase = 'end'; endT = game.status === 'win' ? 1.1 : .9; if (game.status === 'win' && !reduce) burst(); }
  } else if (phase === 'end') { endT -= dt; if (endT <= 0) { phase = 'done'; stop(); result(game.status === 'win'); return; } }
  conf.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.r += p.vr * dt; p.l -= dt; }); conf = conf.filter(p => p.l > 0);
  draw();
}
function burst() { for (let i = 0; i < 70; i++) conf.push({ x: W / 2, y: H * .45, vx: (Math.random() - .5) * 700, vy: -200 - Math.random() * 450, r: Math.random() * 6, vr: (Math.random() - .5) * 12, l: 1 + Math.random() * .6, c: [C.green, C.hi, C.paper][i % 3] }); }
function draw() {
  if (!game || W < 40 || H < 40) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  game.draw(ctx, W, H, T);
  const h = game.hud(), pad = 12;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, 0, W, 4);
  ctx.fillStyle = C.hi; ctx.fillRect(0, 0, W * clamp(h.p, 0, 1), 4);
  const chip = (s, x, align, col) => {
    ctx.font = `700 12px ${FM}`; const w = ctx.measureText(s).width + 20, x0 = align === 'left' ? x : x - w;
    rr(ctx, x0, 14, w, 28, 14); ctx.fillStyle = 'rgba(11,12,11,.74)'; ctx.fill();
    text(ctx, s, x0 + w / 2, 28.5, 12, col || '#fff', 'center', FM, 700);
  };
  chip(h.stage ? `${h.stage} · ${h.l}` : h.l, pad, 'left');
  if (h.r) chip(h.r, W - pad, 'right', h.warn ? '#ff8a6b' : (h.rlabel ? C.hi : '#fff'));
  if (phase === 'count') {
    const n = Math.ceil(count - .4), s = n > 0 ? String(n) : '¡YA!', k = Math.max(0, (count - .4) % 1);
    ctx.fillStyle = 'rgba(11,12,11,.35)'; ctx.fillRect(0, 0, W, H);
    text(ctx, s, W / 2, H / 2, Math.min(W, H) * .22 * (reduce ? 1 : 1 + k * .25), n > 0 ? '#fff' : C.hi);
  }
  for (const p of conf) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.l); ctx.fillStyle = p.c; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
  ctx.globalAlpha = 1;
}

function ticketHTML(t) {
  return `<div class="cj-tk"><div class="pc"><b>${esc(t.descuento)}</b><span>OFF</span></div><div class="tki"><div class="lbl">Tu código</div><div class="code">${esc(t.codigo)}</div><div class="meta">Ganado en ${esc(t.disciplina)} · ${esc(t.fecha)}</div></div></div>`;
}
function ticketActions() {
  return `<div class="cj-row"><button class="cj-btn" type="button" data-act="copy"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>Copiar código</span></button><a class="cj-btn alt" href="${TIENDA}" target="_blank" rel="noopener">Usar en la tienda ${ARROWUP}</a></div>`;
}
function result(win) {
  const box = scr.res.firstElementChild, had = getTicket();
  let t = had;
  if (win && !had) {
    t = { codigo: CUPON.codigo, descuento: CUPON.descuento, disciplina: gdef.name, disciplinaId: gdef.id, fecha: new Date().toLocaleDateString('es-AR') };
    ls.set(LS_TICKET, JSON.stringify(t)); setFab(); refreshSel();
    box.innerHTML = `<p class="k">${esc(gdef.name)} · ¡Lo lograste!</p><h2>¡Ganaste tu cupón!</h2><p class="txt">Usalo en tiendacozy.com con este código. Queda guardado: lo volvés a ver en el botón “Tu cupón”.</p>${ticketHTML(t)}${ticketActions()}<div class="cj-row2"><button class="cj-link" type="button" data-act="again">Jugar otra disciplina</button><button class="cj-link" type="button" data-act="close">Ir a la página</button></div><p class="cj-small">Un cupón por persona.</p>`;
  } else if (win) {
    box.innerHTML = `<p class="k">${esc(gdef.name)} · ¡Bien jugado!</p><h2>Ya ganaste tu cupón</h2><p class="txt">Es uno por persona, así que es el mismo que ganaste antes. Acá lo tenés.</p>${ticketHTML(t)}${ticketActions()}<div class="cj-row2"><button class="cj-link" type="button" data-act="retry">Jugar de nuevo</button><button class="cj-link" type="button" data-act="again">Otra disciplina</button><button class="cj-link" type="button" data-act="close">Ir a la página</button></div>`;
  } else {
    box.innerHTML = `<p class="k">${esc(gdef.name)}</p><h2>¡Casi!</h2><p class="txt">${esc(game.why || 'Esta vez no salió.')} Probá de nuevo: con un par de intentos sale.</p><div class="cj-row" style="margin-top:24px"><button class="cj-btn" type="button" data-act="retry">Reintentar</button><button class="cj-btn alt" type="button" data-act="again">Elegir otra disciplina</button></div><div class="cj-row2"><button class="cj-link" type="button" data-act="close">Ir a la página</button>${had ? '<button class="cj-link" type="button" data-act="ticket">Ver mi cupón</button>' : ''}</div>`;
  }
  show('res');
  setTimeout(() => { const b = box.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 30);
}
function showTicket() {
  const t = getTicket(); if (!t) return show('sel');
  scr.res.firstElementChild.innerHTML = `<p class="k">Tu cupón</p><h2>Tu cupón de ${pct}</h2><p class="txt">Lo ganaste jugando. Es uno por persona y queda guardado en este dispositivo.</p>${ticketHTML(t)}${ticketActions()}<div class="cj-row2"><button class="cj-link" type="button" data-act="again">Jugar igual, por diversión</button><button class="cj-link" type="button" data-act="close">Ir a la página</button></div>`;
  show('res');
}
async function copy(btn) {
  const t = getTicket(), code = t ? t.codigo : CUPON.codigo; let ok = false;
  try { await navigator.clipboard.writeText(code); ok = true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = code; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (_) {} ta.remove();
  }
  const s = btn.querySelector('span'); s.textContent = ok ? '¡Copiado!' : code; setTimeout(() => { s.textContent = 'Copiar código'; }, 1800);
}

root.addEventListener('click', e => {
  const c = e.target.closest('.cj-card'); if (c) return pick(c.dataset.g);
  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (act === 'start') begin();
  else if (act === 'resume') resume();
  else if (act === 'retry') pick(gdef.id);
  else if (act === 'again') { refreshSel(); show('sel'); setTimeout(focusFirst, 30); }
  else if (act === 'close') close();
  else if (act === 'ticket') showTicket();
  else if (act === 'copy') copy(a);
});
$('.cj-skip').addEventListener('click', close);
back.addEventListener('click', () => { refreshSel(); show('sel'); setTimeout(focusFirst, 30); });
root.addEventListener('pointerdown', e => { if (e.target === root) close(); });
fab.addEventListener('click', () => open(getTicket() ? 'ticket' : 'sel'));

addEventListener('keydown', e => {
  if (root.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
  if (e.key === 'Tab') {   // foco atrapado dentro del diálogo
    const f = [...root.querySelectorAll('.cj-top button, .cj-scr.on button, .cj-scr.on a')].filter(el => el.tabIndex >= 0 && el.offsetParent !== null);
    if (!f.length) return; const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    return;
  }
  const a = KEYMAP[e.key]; if (!a || !scr.play.classList.contains('on')) return;
  const onBtn = (e.key === ' ' || e.key === 'Enter') && e.target.closest && e.target.closest('button, a');
  if (phase === 'intro' || phase === 'pause') { if (!onBtn && a === 'a') { e.preventDefault(); phase === 'intro' ? begin() : resume(); } return; }
  e.preventDefault();
  if (phase === 'play' && (!e.repeat || game.id === 'foot')) game.press(a);
}, true);
addEventListener('keyup', e => { if (root.hidden || !game) return; const a = KEYMAP[e.key]; if (a && game.release) game.release(a); }, true);

function pause() { if (phase !== 'play' && phase !== 'count') return; phase = 'pause'; stop(); pauseC.hidden = false; }
function resume() { if (phase !== 'pause') return; pauseC.hidden = true; phase = 'count'; count = 1.4; start(); $('.cj-box').focus({ preventScroll: true }); }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (phase === 'play' || phase === 'count') pause(); else stop(); }
  else if (!root.hidden && game && (phase === 'intro' || phase === 'end')) start();
});
addEventListener('blur', () => { if (phase === 'play') pause(); });

// Hook de prueba: solo lee el estado (la entrada se simula con eventos reales de teclado/puntero)
window.cozyJuego = { state: () => ({ phase, id: game && game.id, status: game && game.status, s: game && game.state ? game.state() : null, W, H }), open, close };

setFab();
const auto = !getTicket() && !ls.get(LS_VISTO);
let booted = false;
const boot = () => {
  if (booted) return; booted = true;
  setTimeout(() => { if (auto) open('sel'); else fab.classList.remove('off'); }, reduce ? 50 : 700);
};
if (document.readyState === 'complete') boot(); else { addEventListener('load', boot); setTimeout(boot, 2600); }
})();
