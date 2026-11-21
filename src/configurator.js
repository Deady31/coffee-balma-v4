// « Compose ton café » : tasse SVG dont le niveau et la couleur changent en direct.
import { gsap } from 'gsap';
import { listen, reducedMotion } from './utils.js';
import { makeSpillable } from './spill.js';

const LEVEL = { petit: 0.42, moyen: 0.64, grand: 0.86 };
const COLOR = { aucun: '#3A2112', entier: '#B98C60', avoine: '#A07A52' };
const SIZE_LABEL = { petit: 'petit', moyen: 'moyen', grand: 'grand' };
const MILK_LABEL = { aucun: 'sans lait', entier: 'au lait entier', avoine: "au lait d'avoine" };
const SUGAR_LABEL = { 0: 'sans sucre', 1: '1 sucre', 2: '2 sucres' };
const BOTTOM = 160; // fond de la tasse (viewBox)
const DEPTH = 92;   // hauteur utile

export function initConfigurator() {
  const form = document.getElementById('cfgForm');
  const svg = document.getElementById('cfgCup');
  const liquid = document.getElementById('cfgLiquid');
  const sugarG = document.getElementById('cfgSugar');
  const recap = document.getElementById('cfgRecap');
  const instant = reducedMotion();
  const val = (n) => form.elements[n].value;

  makeSpillable(svg);

  // Deux sucres au maximum, dessinés une fois
  const cubes = [0, 1].map((i) => {
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', String(158 + i * 19));
    r.setAttribute('y', '164');
    r.setAttribute('width', '15'); r.setAttribute('height', '12'); r.setAttribute('rx', '2');
    r.style.transformOrigin = `${165 + i * 19}px 176px`;
    sugarG.appendChild(r);
    return r;
  });

  function apply() {
    const y = BOTTOM - LEVEL[val('size')] * DEPTH;
    const color = COLOR[val('milk')];
    svg.style.setProperty('--coffee', color);
    gsap.to(liquid, { attr: { y }, duration: instant ? 0 : 0.8, ease: 'power3.out', overwrite: 'auto' });
    const n = Number(val('sugar'));
    cubes.forEach((c, i) => gsap.to(c, { scale: i < n ? 1 : 0, opacity: i < n ? 1 : 0, duration: instant ? 0 : 0.4, ease: 'back.out(2)', overwrite: 'auto' }));
  }

  listen(form, 'change', () => { recap.textContent = ''; apply(); });
  listen(form, 'submit', (e) => {
    e.preventDefault();
    const sentence = `Un ${SIZE_LABEL[val('size')]} café ${MILK_LABEL[val('milk')]}, ${SUGAR_LABEL[val('sugar')]}.`;
    recap.textContent = '';
    sentence.split(' ').forEach((word, i, arr) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = word + (i < arr.length - 1 ? ' ' : '');
      recap.appendChild(s);
    });
    if (!instant) gsap.from(recap.children, { y: 26, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' });
  });
  apply();
}
