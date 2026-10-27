/* Variante A · ciclista rigueado en SVG (unidades en mm, origen en el eje del pedalier) */
(() => {
  const svg = document.getElementById('rider');
  if (!svg) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => svg.getElementById ? svg.getElementById(id) : svg.querySelector('#' + id);
  const f = (n) => n.toFixed(1);
  const P = (p) => f(p[0]) + ' ' + f(p[1]);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const perp = (a) => [-a[1], a[0]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  /* Segmento afinado (cápsula con radios distintos) */
  function capsule(a, b, ra, rb) {
    const d = norm(sub(b, a)), n = perp(d);
    const a1 = add(a, mul(n, ra)), a2 = sub(a, mul(n, ra));
    const b1 = add(b, mul(n, rb)), b2 = sub(b, mul(n, rb));
    return `M${P(a1)}L${P(b1)}A${f(rb)} ${f(rb)} 0 0 0 ${P(b2)}L${P(a2)}A${f(ra)} ${f(ra)} 0 0 0 ${P(a1)}Z`;
  }
  /* Curva suave cerrada por Catmull-Rom */
  function smooth(pts, closed = true) {
    const n = pts.length; let d = `M${P(pts[0])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = add(p1, mul(sub(p2, p0), 1 / 6)), c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
      d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
    }
    return d + (closed ? 'Z' : '');
  }
  /* IK de dos huesos; elige la rodilla/codo según "pick" */
  function ik(a, t, l1, l2, pick) {
    const v = sub(t, a); let d = len(v); d = Math.min(d, l1 + l2 - 0.5);
    const ang = Math.atan2(v[1], v[0]);
    const k = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const j1 = add(a, [l1 * Math.cos(ang - k), l1 * Math.sin(ang - k)]);
    const j2 = add(a, [l1 * Math.cos(ang + k), l1 * Math.sin(ang + k)]);
    const j = pick(j1, j2);
    const end = add(a, mul(norm(v), d));
    return [j, end];
  }

  /* ---------- Geometría de la bici (talle 54, ruta) ---------- */
  const BB = [0, 0];
  const RA = [-405, -70], FA = [586, -70];           // ejes: vainas 410 mm, caída de pedalier 70 mm
  const R_TIRE = 334, R_RIM = 309, R_RIM_IN = 255;
  const STT = [-150, -515], HTT = [392, -560], HTB = [432, -425];
  const SAD = [-205, -735], STEM = [508, -592], HOOD = [578, -600];
  const CR = 172, RING = 104, COG = 46;

  /* ---------- Ciclista ---------- */
  const HIP = [-188, -790];
  const SHO = [362, -958];                           // espalda casi plana, posición aero
  const THIGH = 440, SHIN = 432, UARM = 300, FARM = 285;

  /* Construcción estática */
  const g = (id) => $(id);
  const set = (id, d) => { const e = g(id); if (e) e.setAttribute('d', d); };

  // Ruedas: rayos, aro, cubierta
  function wheel(id, c, n, cross) {
    const grp = g(id); if (!grp) return;
    let sp = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const off = cross ? (i % 2 ? 0.16 : -0.16) : 0;
      const h = [c[0] + 22 * Math.cos(a + off * 3), c[1] + 22 * Math.sin(a + off * 3)];
      const r = [c[0] + R_RIM_IN * Math.cos(a), c[1] + R_RIM_IN * Math.sin(a)];
      sp += `M${P(h)}L${P(r)}`;
    }
    grp.querySelector('.spokes').setAttribute('d', sp);
    // calcomanías del aro (marcan la rotación)
    const arc = (a0, a1, r) => {
      const p0 = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)], p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)];
      return `M${P(p0)}A${r} ${r} 0 0 1 ${P(p1)}`;
    };
    grp.querySelector('.decal').setAttribute('d', arc(-0.55, 0.05, 282) + arc(Math.PI - 0.55, Math.PI + 0.05, 282));
    grp.querySelector('.decal-g').setAttribute('d', arc(0.12, 0.32, 282) + arc(Math.PI + 0.12, Math.PI + 0.32, 282));
  }
  wheel('wheelR', RA, 24, true);
  wheel('wheelF', FA, 20, false);

  // Cuadro
  set('chainstay', capsule(BB, RA, 15, 10));
  set('seatstay', capsule(lerp(STT, BB, 0.06), RA, 11, 8));
  set('seattube', capsule(BB, STT, 20, 17));
  set('toptube', capsule(STT, HTT, 17, 19));
  set('downtube', capsule(BB, lerp(HTB, HTT, 0.05), 26, 22));
  set('dt-decal', capsule(lerp(BB, HTB, 0.68), lerp(BB, HTB, 0.9), 25, 23));
  set('headtube', capsule(HTB, add(HTT, [-4, -14]), 23, 22));
  set('fork', capsule(add(HTB, [4, 8]), FA, 18, 9));
  set('seatpost', capsule(STT, add(SAD, [20, 10]), 13, 13));
  set('saddle', smooth([[-330, -742], [-300, -760], [-200, -758], [-90, -748], [-62, -740], [-100, -728], [-210, -724], [-310, -718]]));
  set('stem', capsule(add(HTT, [-2, -18]), STEM, 15, 15));
  set('spacers', capsule(HTT, add(HTT, [-4, -22]), 19, 19));
  // manubrio de ruta: tope -> curva -> caída
  set('bar', `M${P(STEM)}C${P([548, -594])} ${P([600, -600])} ${P([612, -560])}C${P([628, -510])} ${P([615, -468])} ${P([566, -462])}L${P([532, -470])}`);
  set('hood', smooth([[548, -598], [566, -628], [592, -632], [606, -612], [604, -588], [580, -578], [556, -582]]));
  // caramañola sobre el tubo diagonal
  (() => {
    const a = lerp(BB, HTB, 0.30), b = lerp(BB, HTB, 0.62), d = norm(sub(b, a)), n = perp(d);
    const o = mul(n, -40);
    set('bottle', capsule(add(a, o), add(b, o), 34, 34));
    set('bottle-cap', capsule(add(b, o), add(add(b, o), mul(d, 22)), 16, 14));
  })();

  // Torso (marco local: eje u de cadera a hombro, v hacia el pecho)
  const U = norm(sub(SHO, HIP)), V = [-U[1], U[0]];
  const L = len(sub(SHO, HIP));
  const loc = (x, y) => add(HIP, add(mul(U, x * L / 560), mul(V, y)));
  const torso = [[-78, 4], [-70, -58], [-10, -92], [120, -104], [300, -100], [450, -84], [548, -58], [610, -10], [606, 46], [548, 86], [420, 104], [270, 108], [130, 100], [30, 84], [-40, 64]].map(p => loc(...p));
  set('torso', smooth(torso)); set('torso-rim', smooth(torso));
  set('bib', smooth([[-120, 30], [-110, -120], [70, -130], [62, 40], [40, 140], [-80, 120]].map(p => loc(...p))));
  set('jersey-hem', `M${P(loc(64, -100))}C${P(loc(60, -20))} ${P(loc(56, 40))} ${P(loc(46, 96))}`);
  set('jersey-side', smooth([[90, 40], [300, 70], [520, 40], [560, 70], [420, 104], [270, 108], [130, 100], [60, 90]].map(p => loc(...p))));
  set('jersey-stripe', `M${P(loc(120, -100))}C${P(loc(260, -112))} ${P(loc(420, -96))} ${P(loc(560, -56))}`);
  // Logo Z en el costado del jersey
  const zEl = g('jerseyZ');
  if (zEl) {
    const c = loc(300, 18), ang = Math.atan2(U[1], U[0]) * 180 / Math.PI;
    zEl.setAttribute('transform', `translate(${P(c)}) rotate(${f(ang)}) translate(-70 -42)`);
  }
  // Cabeza y casco
  const NECK = loc(590, -46);
  const HEAD = add(SHO, [118, -46]);
  set('neck', capsule(NECK, add(HEAD, [-30, 38]), 44, 40));
  const hp = (x, y) => add(HEAD, [x, y]);
  set('head', smooth([[-58, -30], [-30, -78], [36, -80], [86, -42], [104, 8], [94, 46], [62, 76], [8, 88], [-46, 60], [-70, 14]].map(p => hp(...p))));
  set('helmet', smooth([[-176, -6], [-120, -70], [-30, -112], [60, -104], [112, -60], [124, -22], [96, -18], [40, -30], [-40, -16], [-112, 10], [-160, 14]].map(p => hp(...p))));
  set('helmet-vent', `M${P(hp(-104, -50))}C${P(hp(-40, -88))} ${P(hp(30, -92))} ${P(hp(86, -62))}`);
  set('helmet-stripe', `M${P(hp(-160, 2))}C${P(hp(-100, -40))} ${P(hp(-20, -58))} ${P(hp(70, -48))}`);
  set('glasses', smooth([[20, -12], [102, -16], [112, 4], [98, 20], [44, 18], [16, 6]].map(p => hp(...p))));
  set('strap', `M${P(hp(-34, -14))}L${P(hp(-6, 64))}L${P(hp(40, 78))}`);
  set('ear', smooth([[-18, -4], [4, -10], [12, 14], [-6, 30], [-22, 16]].map(p => hp(...p))));

  /* ---------- Partes animadas ---------- */
  const near = {}, far = {};
  ['thigh', 'shin', 'calf', 'sock', 'shoe', 'sole', 'short', 'band', 'crank', 'pedal'].forEach(k => { near[k] = g('n-' + k); far[k] = g('f-' + k); });
  const arms = {};
  ['uarm', 'farm', 'sleeve', 'sband', 'glove'].forEach(k => { arms['n' + k] = g('n-' + k); arms['f' + k] = g('f-' + k); });

  function legAt(theta, parts, hipShift) {
    const ped = [BB[0] + CR * Math.cos(theta), BB[1] + CR * Math.sin(theta)];
    const phi = (14 + 13 * Math.sin(theta - 0.45)) * Math.PI / 180;   // "ankling"
    const d = [Math.cos(phi), Math.sin(phi)], n = [Math.sin(phi), -Math.cos(phi)];
    const ankle = add(add(ped, mul(d, -118)), mul(n, 78));
    const hip = add(HIP, hipShift);
    const [knee, ank] = ik(hip, ankle, THIGH, SHIN, (a, b) => (a[1] < b[1] ? a : b));
    const sd = norm(sub(ank, knee)), sn = perp(sd);
    const calf = add(lerp(knee, ank, 0.3), mul(sn, 12));
    if (parts.thigh) parts.thigh.setAttribute('d', capsule(hip, knee, 80, 52));
    if (parts.short) parts.short.setAttribute('d', capsule(hip, lerp(hip, knee, 0.7), 84, 62));
    if (parts.band) parts.band.setAttribute('d', `M${P(add(lerp(hip, knee, 0.7), mul(perp(norm(sub(knee, hip))), 62)))}L${P(sub(lerp(hip, knee, 0.7), mul(perp(norm(sub(knee, hip))), 62)))}`);
    if (parts.calf) parts.calf.setAttribute('d', capsule(knee, calf, 50, 58));
    if (parts.shin) parts.shin.setAttribute('d', capsule(calf, ank, 58, 30));
    if (parts.sock) parts.sock.setAttribute('d', capsule(lerp(knee, ank, 0.78), ank, 36, 32));
    const heel = add(ped, mul(d, -178)), toe = add(ped, mul(d, 96));
    if (parts.shoe) parts.shoe.setAttribute('d', smooth([add(heel, mul(n, 6)), add(add(heel, mul(d, 6)), mul(n, 66)), add(add(ped, mul(d, -64)), mul(n, 96)), add(add(ped, mul(d, 20)), mul(n, 58)), add(add(toe, mul(d, -10)), mul(n, 26)), toe, add(add(ped, mul(d, 30)), mul(n, -10)), add(add(heel, mul(d, 20)), mul(n, -10))]));
    if (parts.sole) parts.sole.setAttribute('d', `M${P(add(add(heel, mul(d, 10)), mul(n, -6)))}L${P(add(toe, mul(d, -8)))}`);
    if (parts.crank) parts.crank.setAttribute('d', capsule(BB, ped, 17, 12));
    if (parts.pedal) parts.pedal.setAttribute('d', capsule(add(ped, mul(d, -40)), add(ped, mul(d, 44)), 9, 9));
  }
  function armsAt(t) {
    const bob = Math.sin(t * 2) * 3;
    const sh = add(loc(498, -22), [0, bob]);
    const hand = add(HOOD, [-6, 6]);
    const [elb, wr] = ik(sh, hand, UARM, FARM, (a, b) => (a[1] > b[1] ? a : b));
    const draw = (p, s, o) => {
      p.uarm && p.uarm.setAttribute('d', capsule(add(s, o), add(elb, o), 46, 34));
      p.sleeve && p.sleeve.setAttribute('d', capsule(add(s, o), add(lerp(s, elb, 0.62), o), 56, 44));
      if (p.sband) { const q = add(lerp(s, elb, 0.62), o), nn = perp(norm(sub(elb, s))); p.sband.setAttribute('d', `M${P(add(q, mul(nn, 44)))}L${P(sub(q, mul(nn, 44)))}`); }
      p.farm && p.farm.setAttribute('d', capsule(add(elb, o), add(wr, o), 34, 24));
      p.glove && p.glove.setAttribute('d', capsule(add(lerp(elb, wr, 0.84), o), add(wr, add(o, [14, -2])), 30, 28));
    };
    draw({ uarm: arms.nuarm, farm: arms.nfarm, sleeve: arms.nsleeve, sband: arms.nsband, glove: arms.nglove }, sh, [0, 0]);
    draw({ uarm: arms.fuarm, farm: arms.ffarm, sleeve: arms.fsleeve, sband: arms.fsband, glove: arms.fglove }, sh, [-22, -6]);
  }

  /* Animación: cadencia 88 rpm, rueda acorde a la relación 53/15 (con "obturador" para evitar estroboscopio) */
  const ring = g('ring'), wF = g('wheelF'), wR = g('wheelR'), chain = g('chain');
  const road = document.querySelectorAll('[data-road]');
  const cadence = 88 / 60 * Math.PI * 2;                   // rad/s
  const wheelSpeed = cadence * 53 / 15 * 0.18;               // velocidad visual (motion blur sugerido)
  let scale = 0.15;
  const measure = () => { scale = svg.getBoundingClientRect().width / 1790; };
  measure(); addEventListener('resize', measure);
  function frame(t) {
    const th = t * cadence - Math.PI / 2 + 0.9;
    legAt(th, near, [0, 0]);
    legAt(th + Math.PI, far, [-6, -8]);
    armsAt(t * cadence);
    const ringDeg = th * 180 / Math.PI;
    ring && ring.setAttribute('transform', `rotate(${f(ringDeg)})`);
    const wd = (t * wheelSpeed * 180 / Math.PI) % 360;
    wF && wF.setAttribute('transform', `rotate(${f(wd)} ${P(FA)})`);
    wR && wR.setAttribute('transform', `rotate(${f(wd)} ${P(RA)})`);
    chain && chain.setAttribute('stroke-dashoffset', f(-(t * cadence * RING) % 26));
    const v = wheelSpeed * R_TIRE * scale;
    road.forEach(el => el.style.setProperty('--x', (-(t * v * Number(el.dataset.road)) % 2000).toFixed(1) + 'px'));
  }
  if (reduce) { frame(0.35); return; }
  let on = true, t0 = performance.now();
  const scene = svg.closest('.rideA');
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(loop); }).observe(scene || svg);
  function loop(now) { if (!on) return; frame((now - t0) / 1000); requestAnimationFrame(loop); }
  frame(0); requestAnimationFrame(loop);
})();
