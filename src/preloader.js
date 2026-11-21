// Préchargeur : la tasse se remplit selon la VRAIE progression du chargement des images de la
// première scène. Le compteur ne dépasse jamais cette progression ; durée minimale 1,2 s.
import { gsap } from 'gsap';
import { pad, clamp } from './utils.js';
import { makeSpillable } from './spill.js';

const LIQ_BOTTOM = 106; // y du fond de la tasse (viewBox)
const LIQ_TOP = 44;     // y du bord

/**
 * @param {object} scrub scène « pour » (createScrub)
 * @param {object} o { reduced, minMs, maxMs }
 * @returns {Promise<void>} résolu quand le rideau commence à se lever (le hero peut démarrer)
 */
export function runPreloader(scrub, { reduced = false, minMs = 1200, maxMs = 15000 } = {}) {
  const root = document.getElementById('preloader');
  const html = document.documentElement;
  if (!root || html.classList.contains('skip-preload')) {
    html.classList.remove('is-loading');
    root?.remove();
    return Promise.resolve();
  }
  const num = document.getElementById('preNum');
  const liquid = root.querySelector('.cup__liquid');
  const cup = document.getElementById('preCup');
  const min = reduced ? 400 : minMs;
  const spill = makeSpillable(cup, { focusable: false });

  return new Promise((resolve) => {
    const t0 = performance.now();
    let shown = 0;
    let last = -1;
    const tick = () => {
      const elapsed = performance.now() - t0;
      const real = scrub ? scrub.loadProgress : 1;
      // Jamais plus que la progression réelle, jamais plus vite que la durée minimale.
      const target = clamp(Math.min(real, elapsed / min));
      shown += (target - shown) * 0.25;
      if (target - shown < 0.002) shown = target;
      const v = Math.round(shown * 100);
      if (v !== last) {
        last = v;
        num.textContent = pad(v);
        if (!spill.busy) liquid.setAttribute('y', String(LIQ_BOTTOM + 4 - (LIQ_BOTTOM + 4 - LIQ_TOP) * shown));
      }
      if (shown >= 1 || elapsed > maxMs) {
        gsap.ticker.remove(tick);
        exit();
      }
    };

    function exit() {
      spill.destroy();
      const tl = gsap.timeline({
        onComplete: () => { root.remove(); html.classList.remove('is-loading'); },
      });
      tl.to(root.querySelector('.preloader__inner'), { y: -30, opacity: 0, duration: reduced ? 0.01 : 0.45, ease: 'power2.in', delay: 0.15 })
        .to(root, { clipPath: 'inset(0 0 100% 0)', duration: reduced ? 0.01 : 1, ease: 'power4.inOut' }, '>-0.05')
        .add(() => resolve(), reduced ? '>' : '-=0.55');
    }

    gsap.ticker.add(tick);
  });
}
