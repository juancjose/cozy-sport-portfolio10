/* Cozy Sport — interacciones y animaciones (vanilla, sin dependencias) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- Preloader ---------- */
  const pre = $('.preloader');
  const hidePre = () => pre && pre.classList.add('done');
  if (reduce) hidePre();
  else { addEventListener('load', () => setTimeout(hidePre, 250)); setTimeout(hidePre, 1800); }

  /* ---------- Datos: equipo ---------- */
  const team = [
    { n: 'Damián', pos: 'DT', role: 'Director', d: 'Apasionado de los deportes y de crear cosas diferentes todos los días.', m: 'damian@cozysport.com', x: 50, y: 0, bench: true },
    { n: 'Mariana', pos: 'Arquera', role: 'Ventas', d: 'Atenta a lo que necesites, siempre con una sonrisa.', m: 'mariana@cozysport.com', x: 50, y: 90 },
    { n: 'Tomás', pos: 'Defensor derecho', role: 'Diseñador', d: 'Creador incansable de diseños: es el encargado de entender tus ideas y transformarlas.', m: 'tomas@cozysport.com', x: 80, y: 74 },
    { n: 'Juan', pos: 'Defensor central', role: 'Producción', d: 'Encargado de que el taller funcione y de que tus prendas estén a tiempo.', x: 46, y: 75 },
    { n: 'Leandro', pos: 'Volante central', role: 'Ventas', d: 'Atento al cliente y a sus inquietudes.', m: 'leandro@cozysport.com', x: 50, y: 52 },
    { n: 'Caro', pos: 'Volante derecha', role: 'Diseño', d: 'Apasionada dibujante y creativa.', m: 'carolina@cozysport.com', x: 80, y: 45 },
    { n: 'Francisco', pos: 'Carrilero', role: 'Marketing y redes', d: 'Su carisma hace que siempre esté sonriente.', m: 'francisco_oliden@cozysport.com', x: 18, y: 60 },
    { n: 'Cozy', pos: 'Carrilero', role: 'Ventas', d: '¡Alma deportiva!', x: 22, y: 27 },
    { n: 'Daniel', pos: 'Utilero', role: 'Armado de pedidos', d: 'Control de pedidos y embalaje.', x: 50, y: 0, bench: true }
  ];
  const ini = (n) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 2).toUpperCase();
  const jersey = '<svg viewBox="0 0 58 62" aria-hidden="true"><path fill="currentColor" d="M18 2l-14 7-4 15 9 3 2-6v39h36V21l2 6 9-3-4-15-14-7c-1 5-6 8-11 8S19 7 18 2z"/></svg>';
  const roster = $('#roster'), pitch = $('#pitch');
  if (roster && pitch) {
    roster.innerHTML = team.map((t, i) => `
      <li class="member rv" style="--d:${i % 2}" data-k="${i}">
        <div class="jersey">${jersey}<b>${ini(t.n)}</b></div>
        <div><span class="pos">${t.pos}</span><h3 class="h3">${t.n}</h3><span class="role">${t.role}</span><p>${t.d}</p>${t.m ? `<a href="mailto:${t.m}">${t.m}</a>` : ''}</div>
      </li>`).join('');
    pitch.insertAdjacentHTML('beforeend', team.map((t, i) => t.bench ? '' :
      `<button class="player" type="button" style="left:${t.x}%;top:${t.y}%" data-k="${i}" aria-label="${t.n}, ${t.pos} (${t.role})"><span class="dot">${ini(t.n)}</span><span class="lbl">${t.pos}</span></button>`).join(''));
    // Banco técnico (DT y utilero) fuera de la cancha, debajo
    const benchRow = document.createElement('div');
    benchRow.className = 'bench-row';
    benchRow.innerHTML = '<span class="bench-t">Banco técnico</span>' + team.map((t, i) => t.bench ?
      `<button class="player benchp" type="button" data-k="${i}" aria-label="${t.n}, ${t.pos} (${t.role})"><span class="dot">${ini(t.n)}</span><span class="lbl">${t.pos}</span></button>` : '').join('');
    pitch.after(benchRow);
    const setOn = (k) => {
      $$('[data-k]').forEach(el => el.classList.toggle('on', el.dataset.k === String(k)));
    };
    $$('.player').forEach(p => {
      p.addEventListener('mouseenter', () => setOn(p.dataset.k));
      p.addEventListener('focus', () => setOn(p.dataset.k));
      p.addEventListener('click', () => {
        setOn(p.dataset.k);
        const m = roster.querySelector(`[data-k="${p.dataset.k}"]`);
        if (m && innerWidth < 1040) m.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    });
    $$('.member').forEach(m => m.addEventListener('mouseenter', () => setOn(m.dataset.k)));
  }

  /* ---------- Datos: deportistas ---------- */
  const ath = [
    ['Fabián Ayala', 'footgolf', 'Footgolfista', 'Campeón argentino 2017'],
    ['Matías Perrone', 'footgolf', 'Footgolfista', 'Campeón mundial 2018'],
    ['Nico García', 'footgolf', 'Footgolfista', 'Número 3 del mundo. Campeón europeo 2018'],
    ['Óscar García', 'triatlon', 'Triatleta', 'Campeón mundial X-Terra'],
    ['Santiago Beltrán', 'triatlon', 'Triatleta', 'Top 10 argentino'],
    ['Brenda Rosso', 'triatlon', 'Triatleta', 'Top 10 argentina'],
    ['Ibrahim Alucin', 'triatlon', 'Triatleta', 'Joven triatleta de gran proyección'],
    ['Maxi Passadore', 'triatlon', 'Triatleta', 'Participó en cuatro Ironman World Championship'],
    ['Cintia Coronel', 'fondo', 'Corredora de fondo', 'Fondista'],
    ['Ignacio Fernández Gorgolas', 'footgolf', 'Footgolfista', 'Campeón argentino 2010 y 2011. Subcampeón argentino 2017'],
    ['Yamil Amuch', 'triatlon', 'Triatleta', 'Triatleta elite argentino'],
    ['Belén Pilara', 'triatlon', 'Triatleta', 'Triatleta pilarense'],
    ['Emma Iodice', 'triatlon', 'Triatleta', 'Campeona argentina de media distancia'],
    ['Ceci Caillabet', 'triatlon', 'Triatleta', 'Triatleta destacada y coach en C3 Equipe'],
    ['Ezequiel Vázquez', 'footgolf', 'Footgolfista profesional', 'Mundialista en 2016 y 2018']
  ];
  const icon = { footgolf: 'i-ball', triatlon: 'i-tri', fondo: 'i-run' };
  const athUl = $('#athletes');
  if (athUl) {
    athUl.innerHTML = ath.map(([n, d, disc, a], i) => {
      const parts = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ');
      const init = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return `<li class="rv" data-d="${d}" data-tilt style="--d:${i % 4}"><svg class="big-ico" aria-hidden="true"><use href="#${icon[d]}"/></svg><span class="av" aria-hidden="true">${init}</span><span class="disc">${disc}</span><h3 class="h3">${n}</h3><p>${a}</p></li>`;
    }).join('');
    $$('.filters button').forEach(b => b.addEventListener('click', () => {
      $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.f;
      $$('li', athUl).forEach(li => {
        const show = f === 'all' || li.dataset.d === f;
        li.classList.toggle('hide', !show);
        if (show && !reduce) li.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    }));
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.rv, .rv-img').forEach(el => reduce ? el.classList.add('in') : io.observe(el));

  /* ---------- Header + menú ---------- */
  const hdr = $('.hdr'), burger = $('.burger');
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.mnav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open'); document.body.style.overflow = ''; burger.setAttribute('aria-expanded', 'false');
  }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click(); });

  // Link activo
  const links = $$('.nav a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const h = a.getAttribute('href'); const s = h.startsWith('#') && $(h); s && secIO.observe(s); });

  /* ---------- Scroll: progreso, parallax, ruta, timeline ---------- */
  const prog = $('.progress');
  const par = $$('[data-parallax]');
  const route = $('#routeDraw'), routeWrap = $('.route-wrap'), routeBase = $('#routeBase'), routeBike = $('#routeBike');
  const tl = $('#timeline');
  let routeLen = 0;
  // Ruta que conecta las etapas: se recalcula según el layout real
  const buildRoute = () => {
    if (!route) return;
    const wr = routeWrap.getBoundingClientRect();
    const pts = $$('.step-n b', routeWrap).map(b => { const r = b.getBoundingClientRect(); return [r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2, r.bottom - wr.top]; });
    const steps = $$('.step', routeWrap).map(s => s.getBoundingClientRect().bottom - wr.top);
    const fin = $('.finish', routeWrap).getBoundingClientRect();
    pts.push([fin.left - wr.left + fin.width / 2, fin.top - wr.top - 6]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1] = pts[i], [x2, y2] = pts[i + 1];
      const gm = i < steps.length - 1 ? (steps[i] + (pts[i + 1][1] - 40)) / 2 + 10 : (steps[i] + y2) / 2;
      const r = Math.min(46, Math.abs(x2 - x1) / 2 || 1);
      d += ` L${x1} ${gm - r} C${x1} ${gm} ${x2} ${gm} ${x2} ${gm + r} L${x2} ${y2}`;
    }
    route.setAttribute('d', d); routeBase.setAttribute('d', d);
    routeLen = route.getTotalLength();
    route.style.strokeDasharray = routeLen;
  };
  buildRoute();
  let lastY = scrollY, ticking = false, spinT;
  const vis = new Set();
  const visIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)), { rootMargin: '20% 0px' });
  par.forEach(p => visIO.observe(p));
  const sectionProgress = (el, start = 0.85, end = 0.35) => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    return Math.min(1, Math.max(0, (vh * start - r.top) / (r.height + vh * (start - end))));
  };
  const onScroll = () => {
    const y = scrollY, max = document.body.scrollHeight - innerHeight;
    prog.style.setProperty('--p', (y / max).toFixed(4));
    hdr.classList.toggle('scrolled', y > 40);
    hdr.classList.toggle('hide', y > 600 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
    if (!reduce) {
      vis.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        const c = (r.top + r.height / 2 - innerHeight / 2);
        el.style.transform = `translate3d(0,${(-c * parseFloat(el.dataset.parallax)).toFixed(1)}px,0)`;
      });
      if (route) {
        const k = sectionProgress(routeWrap, 0.75, 0.55);
        route.style.strokeDashoffset = (routeLen * (1 - k)).toFixed(1);
        const pt = route.getPointAtLength(routeLen * k);
        routeBike.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      }
    } else if (route) { route.style.strokeDashoffset = 0; routeBike.style.display = 'none'; }
    if (tl) tl.style.setProperty('--tp', sectionProgress(tl, 0.7, 0.5).toFixed(3));
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    prog.style.setProperty('--spin', 'running');
    clearTimeout(spinT); spinT = setTimeout(() => prog.style.setProperty('--spin', 'paused'), 160);
  }, { passive: true });
  addEventListener('resize', () => { buildRoute(); onScroll(); });
  addEventListener('load', () => { buildRoute(); onScroll(); });
  document.fonts && document.fonts.ready.then(() => { buildRoute(); onScroll(); });
  onScroll();

  /* ---------- Taller: etapas con imagen sticky ---------- */
  const stageImgs = $$('.ws-stage img'), wsNum = $('#wsNum');
  const wsIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = +e.target.dataset.i;
    $$('.ws-step').forEach(s => s.classList.toggle('on', s === e.target));
    stageImgs.forEach((im, k) => im.classList.toggle('on', k === i));
    if (wsNum) wsNum.textContent = String(i + 1).padStart(2, '0');
  }), { rootMargin: '-45% 0px -45% 0px' });
  $$('.ws-step').forEach(s => wsIO.observe(s));

  /* ---------- Tilt 3D ---------- */
  if (fine && !reduce) {
    document.addEventListener('pointermove', e => {
      const el = e.target.closest('[data-tilt]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateY(-4px)`;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    document.addEventListener('pointerout', e => {
      const el = e.target.closest('[data-tilt]');
      if (el && !el.contains(e.relatedTarget)) el.style.transform = '';
    });
  }

  /* ---------- Ciclista del hero: piernas que pedalean ---------- */
  const bike = $('#heroBike');
  if (bike) {
    const near = $('#legNear', bike), far = $('#legFar', bike), crank = $('#crank', bike);
    const H = [80, 44], B = [88, 88], R = 9, L1 = 27, L2 = 28;
    const leg = (a) => {
      const P = [B[0] + R * Math.cos(a), B[1] + R * Math.sin(a)];
      const dx = P[0] - H[0], dy = P[1] - H[1], d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01);
      const t = Math.atan2(dy, dx), k = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
      const K = [H[0] + L1 * Math.cos(t - k), H[1] + L1 * Math.sin(t - k)];
      return { d: `M${H[0]} ${H[1]}L${K[0].toFixed(1)} ${K[1].toFixed(1)}L${P[0].toFixed(1)} ${P[1].toFixed(1)}l6 0`, P };
    };
    const draw = (a) => {
      const l1 = leg(a), l2 = leg(a + Math.PI);
      near.setAttribute('d', l1.d); far.setAttribute('d', l2.d);
      crank.setAttribute('d', `M${l2.P[0].toFixed(1)} ${l2.P[1].toFixed(1)}L${l1.P[0].toFixed(1)} ${l1.P[1].toFixed(1)}`);
    };
    draw(0.6);
    if (!reduce) {
      let on = true;
      new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(loop); }).observe($('.hero'));
      const loop = (t) => { if (!on) return; draw(t / 1000 * 7); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- Video (carga diferida) ---------- */
  $$('[data-yt]').forEach(b => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
    f.title = b.getAttribute('aria-label').replace('Reproducir video: ', '');
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    const box = Object.assign(document.createElement('div'), { className: 'video' });
    box.appendChild(f); b.replaceWith(box);
  }));

  /* ---------- Formulario → mailto ---------- */
  const form = $('#contactForm');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form), note = $('#formNote');
    if (!fd.get('nombre') || !fd.get('email') || !fd.get('mensaje')) {
      note.textContent = 'Completá nombre, email y tu idea para poder enviarte una respuesta.';
      note.style.color = '#b42318';
      form.querySelector(':invalid')?.focus();
      return;
    }
    const body = [...fd.entries()].filter(([, v]) => v).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`).join('\n');
    location.href = `mailto:info@cozysport.com?subject=${encodeURIComponent('Consulta web — ' + (fd.get('equipo') || fd.get('nombre')))}&body=${encodeURIComponent(body)}`;
    note.style.color = ''; note.textContent = '¡Listo! Se abrió tu correo con la consulta. Si no se abrió, escribinos a info@cozysport.com.';
  });

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
