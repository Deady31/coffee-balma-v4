// Curseur personnalisé (ordinateur uniquement) et boutons magnétiques.
import { gsap } from 'gsap';
import { isFinePointer, reducedMotion, listen } from './utils.js';

const CLICKABLE = 'a, button, label, [role="button"], input, [data-cursor]';

export function initCursor() {
  if (!isFinePointer() || reducedMotion()) return;
  const html = document.documentElement;
  const ring = document.getElementById('cursor');
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  html.classList.add('has-cursor');

  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' });

  listen(window, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    html.classList.add('cursor-on');
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  }, { passive: true });
  listen(document, 'pointerover', (e) => ring.classList.toggle('is-big', !!e.target.closest?.(CLICKABLE)));
  listen(document.documentElement, 'mouseleave', () => html.classList.remove('cursor-on'));
  listen(window, 'pagehide', () => { dot.remove(); html.classList.remove('has-cursor'); });
}

/** Attire légèrement les éléments [data-magnetic] vers le curseur. */
export function initMagnetic() {
  if (!isFinePointer() || reducedMotion()) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    let rect = null;
    const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    // La géométrie n'est lue qu'à l'entrée, jamais pendant le mouvement.
    listen(el, 'pointerenter', () => { rect = el.getBoundingClientRect(); });
    listen(el, 'pointermove', (e) => {
      if (!rect) return;
      qx((e.clientX - (rect.left + rect.width / 2)) * 0.35);
      qy((e.clientY - (rect.top + rect.height / 2)) * 0.45);
    });
    listen(el, 'pointerleave', () => { qx(0); qy(0); rect = null; });
  });
}
