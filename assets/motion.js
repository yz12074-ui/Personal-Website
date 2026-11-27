// Smooth scrolling (Lenis) and scroll-in reveals. Plain JS, no build step.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const home = !!document.getElementById('hwrap');
  if (reduced) return;

  const css = document.createElement('style');
  css.textContent = `
    html.lenis, html.lenis body { height: auto; }
    .lenis.lenis-smooth { scroll-behavior: auto !important; }
    .lenis.lenis-stopped { overflow: hidden; }
    .rv { opacity: 0; translate: 0 28px; }
    .rv.in { opacity: 1; translate: 0 0; transition: opacity .7s ease, translate .9s cubic-bezier(.22, 1, .36, 1); transition-delay: var(--d, 0ms); }

    :root { --dx: 140px; --dy: 0px; }
    @media not ((min-width: 900px) and (hover: hover)) { :root { --dx: 0px; --dy: 44px; } }
    .rx { opacity: 0; }
    .rx.go { opacity: 1; animation: var(--k) .9s cubic-bezier(.34, 1.56, .64, 1) var(--d, 0ms) both; }
    @keyframes k-head { from { opacity: 0; translate: calc(var(--dx) * 1.2) calc(var(--dy) * 1.2); } }
    @keyframes k-card { from { opacity: 0; translate: calc(var(--dx) * 1.4) calc(var(--dy) + 50px); rotate: 7deg; scale: .92; } }
    @keyframes k-pop  { from { opacity: 0; translate: calc(var(--dx) * .5) calc(var(--dy) * .5); rotate: -10deg; scale: .5; } }
    @keyframes k-blur { from { opacity: 0; translate: calc(var(--dx) * .7) calc(var(--dy) * .7); filter: blur(10px); } }`;
  document.head.append(css);

  // ---------- smooth scroll ----------
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js';
  s.onload = () => {
    const lenis = new Lenis({
      lerp: 0.1,
      gestureOrientation: home ? 'both' : 'vertical',
      // let inner scrollers (phones, lists, carousels) scroll on their own
      prevent: n => { for (let e = n; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e); if (/(auto|scroll)/.test(o.overflowY) && e.scrollHeight > e.clientHeight + 1) return true; } return false; },
    });
    window.lenis = lenis;
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // in-page anchors glide too (the homepage's wide layout handles its own)
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || a.getAttribute('href') === '#') return;
      const t = document.querySelector(a.getAttribute('href')); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -20, duration: 1.2 }); history.replaceState(null, '', a.getAttribute('href'));
    });
  };
  document.head.append(s);

  // ---------- scroll-in reveals (case pages; the homepage has its own stagger) ----------
  if (!home) addEventListener('DOMContentLoaded', () => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('main section > *, main > article > *').forEach(el => {
      if (el.closest('.reveal, .phone, iframe') || el.matches('script, style, iframe') || getComputedStyle(el).position === 'fixed') return;
      if (el.getBoundingClientRect().top < innerHeight) return;   // already on screen: leave it alone
      el.classList.add('rv'); io.observe(el);
    });
  });

  // ---------- homepage: content that scrolls into view from the right (or from below on phones), each kind its own way ----------
  if (home) addEventListener('load', () => {
    const groups = [
      ['k-head', '.work-head, .sec-head, .contact'],
      ['k-card', '.work .card'],
      ['k-pop', '.plays .play:not([hidden]), .about-photo'],
      ['k-blur', '.about .txt > *, .contact > *, .foot .the-end > *'],
    ];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const el = e.target; io.unobserve(el); el.classList.add('go');
      el.addEventListener('animationend', ev => { if (ev.target === el) el.classList.remove('rx', 'go'); });
    }), { rootMargin: '0px -6% 0px -6%' });
    for (const [k, sel] of groups) {
      const n = new Map();
      document.querySelectorAll(sel).forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.left < innerWidth && r.top < innerHeight) return;   // first screen: the hero stagger handles it
        const i = n.get(el.parentElement) || 0; n.set(el.parentElement, i + 1);
        el.style.setProperty('--k', k); el.style.setProperty('--d', Math.min(i * 90, 450) + 'ms');
        el.classList.add('rx'); io.observe(el);
      });
    }
  });
})();
