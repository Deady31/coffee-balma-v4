// Menu plein écran : accessible au clavier (Échap, piège de focus, retour du focus).
import { gsap } from 'gsap';
import { listen, reducedMotion } from './utils.js';

export function initMenu(onNavigate) {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  const links = [...menu.querySelectorAll('a')];
  const main = document.getElementById('main');
  let open = false;

  function set(state) {
    if (state === open) return;
    open = state;
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.menu-btn__label').textContent = open ? 'Fermer' : 'Menu';
    const dur = reducedMotion() ? 0.01 : 0.7;
    if (open) {
      menu.hidden = false;
      main.inert = true;
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: dur, ease: 'power4.out' });
      gsap.fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: dur, stagger: 0.06, ease: 'power3.out', delay: 0.1 });
      links[0].focus({ preventScroll: true });
    } else {
      main.inert = false;
      gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: dur * 0.7, ease: 'power3.in', onComplete: () => { menu.hidden = true; } });
      btn.focus({ preventScroll: true });
    }
    onNavigate?.(open);
  }

  listen(btn, 'click', () => set(!open));
  links.forEach((a) => listen(a, 'click', () => set(false)));
  listen(document, 'keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { set(false); return; }
    if (e.key === 'Tab') {
      // Piège de focus entre le bouton et les liens
      const ring = [btn, ...links];
      const i = ring.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? ring.length - 1 : i - 1) : (i === ring.length - 1 ? 0 : i + 1);
      ring[next].focus();
      e.preventDefault();
    }
  });
}
