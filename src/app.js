'use strict';
// ナビ背景
const nav = document.getElementById('nav');
addEventListener('scroll', () => { nav.classList.toggle('solid', scrollY > 40); }, { passive: true });

// ドロワーメニュー
const menuBtn = document.getElementById('menuBtn');
const mMenu = document.getElementById('mMenu');
const setMenu = (open) => {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? menuBtn.dataset.lc : menuBtn.dataset.lo);
  if (open) mMenu.hidden = false;
  requestAnimationFrame(() => mMenu.classList.toggle('open', open));
  document.body.classList.toggle('menu-open', open);
  if (!open) setTimeout(() => { if (!mMenu.classList.contains('open')) mMenu.hidden = true; }, 400);
};
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
mMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// スクロール表示
const io = new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
}, { threshold: .15 });
document.querySelectorAll('.rv').forEach((el) => io.observe(el));

// ヒーローは即表示、円相は一筆で描く
requestAnimationFrame(() => {
  document.querySelectorAll('.hero .rv').forEach((el) => el.classList.add('on'));
  const enso = document.querySelector('.enso');
  if (enso) requestAnimationFrame(() => enso.classList.add('draw'));
});

// 桜 — 灰桜と金箔の花びらが、ヒーローにだけ、まばらに舞う
(() => {
  const cv = document.querySelector('.sakura');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');
  const hero = cv.parentElement;
  let W = 0, H = 0, dpr = 1, petals = [], running = false, raf = 0;

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(16, Math.max(8, Math.round(W / 110)));
    petals = Array.from({ length: n }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : -20,
    s: 4 + Math.random() * 5,              // 花びらの大きさ
    vy: .25 + Math.random() * .5,          // 落下速度
    ph: Math.random() * Math.PI * 2,       // 揺れの位相
    sw: .3 + Math.random() * .7,           // 揺れ幅
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - .5) * .02,
    gold: Math.random() < .25,             // 4枚に1枚は金箔
    a: .18 + Math.random() * .22,
  });
  const petal = (p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = (p.gold ? 'rgba(176,141,87,' : 'rgba(216,183,181,') + p.a + ')';
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.bezierCurveTo(p.s * .75, -p.s * .55, p.s * .6, p.s * .5, 0, p.s);
    ctx.bezierCurveTo(-p.s * .6, p.s * .5, -p.s * .75, -p.s * .55, 0, -p.s);
    ctx.fill();
    ctx.restore();
  };
  const tick = () => {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.ph += .012; p.rot += p.vr;
      p.x += Math.sin(p.ph) * p.sw; p.y += p.vy;
      if (p.y > H + 20) petals[i] = spawn(false);
      petal(p);
    }
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((es) => {
    const on = es[0].isIntersecting && !document.hidden;
    if (on && !running) { running = true; tick(); }
    if (!on) { running = false; cancelAnimationFrame(raf); }
  });
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else { io.disconnect(); io.observe(hero); }
  });
  resize();
  io.observe(hero);
})();
