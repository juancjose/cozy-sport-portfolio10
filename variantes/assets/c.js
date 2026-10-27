/* Variante C · video lazy, sin autoplay con reduced-motion */
(() => {
  const v = document.getElementById('vC'); if (!v) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) { v.classList.add('ready'); return; } // queda el póster, sin reproducir
  let loaded = false;
  const load = () => {
    if (loaded) return; loaded = true;
    for (const [t, k] of [['video/webm', 'srcWebm'], ['video/mp4', 'srcMp4']]) { const s = document.createElement('source'); s.type = t; s.src = v.dataset[k]; v.appendChild(s); }
    v.load(); v.playbackRate = 1;
    v.addEventListener('canplay', () => { v.classList.add('ready'); v.play().catch(() => {}); }, { once: true });
  };
  v.classList.add('ready'); // muestra el póster mientras tanto
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { load(); loaded && v.readyState > 2 && v.play().catch(() => {}); } else if (loaded) v.pause();
  }), { rootMargin: '200px' }).observe(v);
})();
