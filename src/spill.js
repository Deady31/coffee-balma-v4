// Détail caché : un clic sur une tasse la fait déborder.
import { gsap } from 'gsap';
import { listen } from './utils.js';

export function makeSpillable(svg, { focusable = true } = {}) {
  const liquid = svg.querySelector('.cup__liquid');
  const drip = svg.querySelector('.cup__drip');
  const api = { busy: false, destroy() { svg.removeEventListener('click', go); svg.removeEventListener('keydown', key); } };
  if (!drip) return api;

  function go() {
    if (api.busy) return;
    api.busy = true;
    const y0 = liquid.getAttribute('y');
    const tl = gsap.timeline({ onComplete: () => { api.busy = false; } });
    tl.to(svg, { rotate: -4, transformOrigin: '50% 90%', duration: 0.12, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to(liquid, { attr: { y: Number(y0) - 8 }, duration: 0.35, ease: 'power2.out' }, 0)
      .set(drip, { opacity: 1, strokeDashoffset: 1 }, 0.1)
      .to(drip, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.in' }, 0.1)
      .to(drip, { opacity: 0, duration: 0.6, delay: 1 })
      .to(liquid, { attr: { y: y0 }, duration: 1.2, ease: 'power2.inOut' }, '<');
  }
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };

  svg.addEventListener('click', go);
  if (focusable) {
    svg.setAttribute('role', 'button');
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', key);
  }
  listen(window, 'pagehide', api.destroy);
  return api;
}
