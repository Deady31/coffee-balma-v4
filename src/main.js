import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource-variable/dm-sans/wght.css';
import '../styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { reducedMotion, listen, cleanup, onCleanup, clamp, pad } from './utils.js';
import { loadManifest, createScrub } from './scrub.js';
import { runPreloader } from './preloader.js';
import { initCursor, initMagnetic } from './cursor.js';
import { initMenu } from './menu.js';
import { initMarquee } from './marquee.js';
import { initCarte } from './carte.js';
import { initInfos } from './infos.js';
import { initConfigurator } from './configurator.js';
import { makeSpillable } from './spill.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const html = document.documentElement;

async function main() {
  const reduced = reducedMotion();
  const loading = !html.classList.contains('skip-preload');
  if (loading) html.classList.add('is-loading');

  // ---- Scroll fluide synchronisé avec GSAP ----
  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    onCleanup(() => { gsap.ticker.remove(raf); lenis.destroy(); });
    if (loading) lenis.stop();
  }
  // Ancres internes (Lenis si présent, sinon comportement natif)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    listen(a, 'click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target || !lenis) return;
      e.preventDefault();
      if (target.id === 'hero') lenis.scrollTo(0, { duration: 1.6 });
      else lenis.scrollTo(target, { duration: 1.6 });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // ---- Scènes : manifestes d'abord (ordre des pins), puis moteur ----
  const names = ['hero', 'grain', 'finale'];
  const sections = Object.fromEntries(names.map((n) => [n, document.getElementById(n)]));
  const manifests = await Promise.all(names.map((n) => loadManifest(sections[n].dataset.scene)));
  const [hero, grain, finale] = names.map((n, i) =>
    createScrub(sections[n], manifests[i], n === 'finale' ? { end: 160, mobileEnd: 140, scrub: 0.5, reduced } : { end: 300, mobileEnd: 220, scrub: 0.6, reduced })
  );

  setupHero(hero, reduced);
  setupGrain(grain, reduced);
  setupFinale(finale, reduced);

  initMenu((open) => { if (!lenis) return; open ? lenis.stop() : lenis.start(); });
  initMarquee();
  initCarte();
  initInfos();
  initConfigurator();
  initCursor();
  initMagnetic();
  setupFooter(reduced);
  makeSpillable($('#footCup'));
  setupTabTitle();
  ScrollTrigger.create({
    trigger: '#compose', start: 'top 60px', end: 'bottom 60px',
    onToggle: (self) => $('#topbar').classList.toggle('on-light', self.isActive),
  });

  // ---- Préchargeur : suit le vrai chargement de la première scène ----
  await runPreloader(hero, { reduced });
  lenis?.start();
  heroIntro(reduced);

  // Mesures finales une fois les polices et les images prêtes
  await Promise.all([document.fonts.ready, hero.loaded, grain.loaded, finale.loaded]);
  ScrollTrigger.refresh();
  const onResize = () => ScrollTrigger.refresh();
  listen(window, 'orientationchange', onResize);
}

/* ---------------------------------------------------------------- HERO */
let heroSplit = null;
function setupHero(hero, reduced) {
  if (reduced) return;
  const title = $('#heroTitle');
  const sub = $('[data-cue="sub"]');
  const cta = $('[data-cue="cta"]');
  gsap.set([sub, cta], { autoAlpha: 0 });

  let titleVisible = true;
  hero.cue(0.06, (fwd) => {
    if (!heroSplit) return;
    titleVisible = !fwd;
    gsap.to(heroSplit.words, { yPercent: fwd ? -115 : 0, duration: 0.7, stagger: fwd ? 0.04 : 0.02, ease: fwd ? 'power3.in' : 'power3.out', overwrite: 'auto' });
  });
  hero.cue(0.32, (fwd) => {
    gsap.to(sub, { autoAlpha: fwd ? 1 : 0, y: fwd ? 0 : 40, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
  });
  hero.cue(0.85, (fwd) => {
    gsap.to(cta, { autoAlpha: fwd ? 1 : 0, y: fwd ? 0 : 30, scale: fwd ? 1 : 0.9, duration: 0.8, ease: 'back.out(1.6)', overwrite: 'auto' });
  });

  // Indice de scroll : disparaît dès le premier défilement
  const hint = $('#scrollHint');
  let hidden = false;
  listen(window, 'scroll', () => {
    const away = window.scrollY > 8;
    if (away !== hidden) { hidden = away; gsap.to(hint, { autoAlpha: away ? 0 : 1, duration: 0.4, overwrite: 'auto' }); }
  }, { passive: true });
}

function heroIntro(reduced) {
  const title = $('#heroTitle');
  const eyebrow = $('.hero__eyebrow');
  if (reduced) return;
  gsap.set([title, eyebrow], { visibility: 'visible' });
  heroSplit = SplitText.create(title, {
    type: 'lines,words',
    mask: 'lines',
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.words, { yPercent: 115, duration: 1.2, stagger: 0.09, ease: 'power4.out' });
    },
  });
  gsap.from(eyebrow, { opacity: 0, x: -20, duration: 1, delay: 0.6, ease: 'power3.out' });
  gsap.from('#scrollHint', { opacity: 0, duration: 1, delay: 1.6 });
}

/* --------------------------------------------------------------- GRAIN */
function setupGrain(grain, reduced) {
  if (reduced) return;
  const steps = [...document.querySelectorAll('.step')];
  const ticks = [...document.querySelectorAll('#grainProgress .progress__ticks li')];
  const fill = $('#grainProgress .progress__fill');
  const setFill = gsap.quickSetter(fill, 'scaleY');
  let active = 0;
  const activate = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    ticks.forEach((t, k) => t.classList.toggle('is-active', k === i));
  };
  [0.25, 0.5, 0.75].forEach((p, k) => grain.cue(p, (fwd) => activate(fwd ? k + 1 : k)));
  grain.onProgress((p) => setFill(clamp(p)));
}

/* -------------------------------------------------------------- FINALE */
function setupFinale(finale, reduced) {
  if (reduced) return;
  const title = $('[data-cue="finale"]');
  const split = SplitText.create(title, { type: 'lines,words', mask: 'lines', autoSplit: true });
  gsap.set(title, { autoAlpha: 1 });
  gsap.set(split.words, { yPercent: 115 });
  finale.cue(0.3, (fwd) => {
    gsap.to(split.words, { yPercent: fwd ? 0 : 115, duration: 1, stagger: 0.07, ease: 'power4.out', overwrite: 'auto' });
  });
}

/* --------------------------------------------------------------- FOOTER */
function setupFooter(reduced) {
  if (reduced) return;
  const giant = $('#giant');
  const split = SplitText.create(giant, { type: 'chars', mask: 'chars', aria: 'none' });
  gsap.fromTo(split.chars, { yPercent: 110 }, {
    yPercent: 0, ease: 'none', stagger: 0.08,
    scrollTrigger: { trigger: '#footer', start: 'top 85%', end: 'bottom bottom', scrub: 0.5 },
  });
}

/* ----------------------------------------------------------- TITRE ONGLET */
function setupTabTitle() {
  const original = document.title;
  listen(document, 'visibilitychange', () => {
    document.title = document.hidden ? 'Ton café refroidit…' : original;
  });
}

// ---- Démarrage, avec filet de sécurité : jamais de page vide ----
main().catch((err) => {
  console.error(err);
  html.classList.add('no-anim');
  html.classList.remove('is-loading');
  $('#preloader')?.remove();
});
listen(window, 'pagehide', cleanup);
