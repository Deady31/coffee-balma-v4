// Bandeau défilant : sa vitesse suit celle du scroll.
import { gsap } from 'gsap';
import { reducedMotion, onCleanup, clamp } from './utils.js';

export function initMarquee() {
  const root = document.getElementById('marquee');
  const track = root.querySelector('.marquee__track');
  if (reducedMotion()) return;
  const original = [...track.children];
  original.forEach((n) => track.appendChild(n.cloneNode(true))); // deux jeux : on boucle à -50 %
  let x = 0;
  let dir = -1;
  let speed = 0;
  let lastY = window.scrollY;
  let visible = true;

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(root);

  const tick = (_t, deltaMs) => {
    if (!visible) { lastY = window.scrollY; return; }
    const y = window.scrollY;
    const v = (y - lastY) / Math.max(deltaMs, 1); // px/ms
    lastY = y;
    if (Math.abs(v) > 0.02) dir = v > 0 ? -1 : 1;
    speed += (clamp(Math.abs(v), 0, 4) - speed) * 0.08;
    x += dir * (0.018 + speed * 0.09) * deltaMs; // % par ms
    if (x <= -50) x += 50;
    if (x > 0) x -= 50;
    gsap.set(track, { xPercent: x });
  };
  gsap.ticker.add(tick);
  onCleanup(() => { gsap.ticker.remove(tick); io.disconnect(); });
}
