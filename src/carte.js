// La carte éditoriale : le fond de TOUTE la section change au survol, une carte suit le curseur.
import { gsap } from 'gsap';
import { isFinePointer, listen } from './utils.js';

export function initCarte() {
  const section = document.getElementById('carte');
  const rows = [...section.querySelectorAll('.row')];
  const list = document.getElementById('carteList');
  const card = document.getElementById('floatCard');
  const text = document.getElementById('floatText');
  const fine = isFinePointer();

  const wash = (row) => {
    section.style.setProperty('--wash', row.dataset.bg);
    section.style.setProperty('--fg', row.dataset.fg);
    section.classList.add('is-washed');
    document.getElementById('topbar').classList.toggle('on-light', row.dataset.fg === '#1A130E');
  };
  const unwash = () => {
    section.classList.remove('is-washed');
    section.style.removeProperty('--fg');
    document.getElementById('topbar').classList.remove('on-light');
  };

  if (fine) {
    rows.forEach((r) => r.removeAttribute('aria-expanded'));
    const qx = gsap.quickTo(card, 'x', { duration: 0.45, ease: 'power3.out' });
    const qy = gsap.quickTo(card, 'y', { duration: 0.45, ease: 'power3.out' });
    listen(list, 'pointermove', (e) => {
      qx(Math.min(e.clientX + 26, window.innerWidth - 280));
      qy(e.clientY + 22);
    });
    rows.forEach((row) => {
      const show = () => { wash(row); text.textContent = row.dataset.note; card.classList.add('is-on'); };
      listen(row, 'pointerenter', show);
      listen(row, 'focus', () => { wash(row); text.textContent = row.dataset.note; });
    });
    listen(list, 'pointerleave', () => { unwash(); card.classList.remove('is-on'); });
    listen(list, 'focusout', (e) => { if (!list.contains(e.relatedTarget)) unwash(); });
  } else {
    // Toucher : un appui ouvre la note sous la ligne et teinte la section.
    rows.forEach((row) => {
      listen(row, 'click', () => {
        const open = row.getAttribute('aria-expanded') === 'true';
        rows.forEach((r) => r.setAttribute('aria-expanded', 'false'));
        if (open) { unwash(); return; }
        row.setAttribute('aria-expanded', 'true');
        wash(row);
      });
    });
  }
}
