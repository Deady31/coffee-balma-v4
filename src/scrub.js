// Moteur « scroll scrub » : séquence d'images WebP dessinée sur un <canvas>, pilotée par le scroll.
//
// Mémoire : on garde les images COMPRESSÉES (Blob) et on ne décode qu'une fenêtre autour de
// l'image courante (+ un jeu de vignettes grossières en permanence). 240 images 1600 px
// décodées d'un coup pèseraient plus d'1 Go.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, pad, isTouchLike, mq, listen, onCleanup } from './utils.js';

const BASE = import.meta.env.BASE_URL || './';
const COARSE_STEP = 12;     // une image sur N pour l'aperçu grossier
const COARSE_WIDTH = 720;   // largeur des vignettes décodées en permanence
const WINDOW_BEHIND = 6;
const WINDOW_AHEAD = 14;

const frameUrl = (scene, set, i) => `${BASE}frames/${scene}/${set}/${pad(i + 1, 4)}.webp`;

let indexPromise = null;
/** Lit frames/scenes.json une seule fois : une scène absente ne génère aucune requête en erreur. */
function loadIndex() {
  indexPromise ??= fetch(`${BASE}frames/scenes.json`, { cache: 'no-cache' })
    .then((r) => (r.ok && !(r.headers.get('content-type') || '').includes('text/html') ? r.json() : { scenes: {} }))
    .catch(() => ({ scenes: {} }));
  return indexPromise;
}

/** Manifeste d'une scène, ou null (-> fallback typographique). */
export async function loadManifest(scene) {
  const { scenes } = await loadIndex();
  const m = scenes?.[scene];
  return m && m.count > 0 ? m : null;
}

const decodeBlob = (blob, opts) =>
  typeof createImageBitmap === 'function'
    ? createImageBitmap(blob, opts)
    : new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
const dims = (b) => ({ w: b.width || b.naturalWidth, h: b.height || b.naturalHeight });

/**
 * @param {HTMLElement} section  section avec data-scene et un <canvas>
 * @param {object|null} manifest contenu de manifest.json (null = fallback typographique)
 * @param {object} opts { end, mobileEnd, scrub, reduced }
 */
export function createScrub(section, manifest, opts = {}) {
  const { end = 300, mobileEnd = 220, scrub = 0.6, reduced = false } = opts;
  const scene = section.dataset.scene;
  const canvas = section.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const ghost = section.querySelector('[data-ghost]');
  const hasFrames = !!manifest;
  const count = hasFrames ? manifest.count : 100; // 100 « graduations » virtuelles pour le fallback
  const lastIndex = count - 1;
  const set = mq('(max-width: 768px)').matches || isTouchLike() ? 'mobile' : 'desktop';

  const cues = [];
  const progressListeners = [];
  const loadListeners = [];
  const blobs = new Array(count).fill(null);
  const decoded = new Map();   // index -> bitmap (fenêtre glissante)
  const coarse = new Map();    // index -> vignette (permanente)
  const pending = new Set();
  let fetched = 0;
  let current = 0;
  let lastDrawn = -1;
  let visible = true;
  let cw = 0;
  let ch = 0;
  let lastP = 0;
  let lastGhost = -1;
  let destroyed = false;
  const abort = new AbortController();

  section.classList.toggle('no-frames', !hasFrames);

  // ---------- Dessin « cover » ----------
  function draw(bmp) {
    const { w, h } = dims(bmp);
    const s = Math.max(cw / w, ch / h);
    const dw = w * s;
    const dh = h * s;
    ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function nearest(i) {
    if (decoded.has(i)) return decoded.get(i);
    if (coarse.has(i)) return coarse.get(i);
    for (let d = 1; d <= COARSE_STEP; d++) {
      const a = decoded.get(i - d) || coarse.get(i - d);
      const b = decoded.get(i + d) || coarse.get(i + d);
      if (b) return b;
      if (a) return a;
    }
    return null;
  }

  function render(force = false) {
    if (!hasFrames || !cw || (!visible && !force)) return;
    if (current === lastDrawn && !force) return;
    const bmp = nearest(current);
    if (!bmp) return;
    draw(bmp);
    // Si on affiche une vignette de remplacement, on réessaie quand l'image exacte arrive.
    lastDrawn = decoded.has(current) || coarse.get(current) === bmp ? current : -1;
  }

  // ---------- Chargement ----------
  async function fetchFrame(i) {
    if (blobs[i] || destroyed) return;
    try {
      const res = await fetch(frameUrl(scene, set, i), { signal: abort.signal });
      if (!res.ok) throw new Error(String(res.status));
      blobs[i] = await res.blob();
    } catch { /* image manquante : on affichera la plus proche */ }
    fetched++;
    loadListeners.forEach((fn) => fn(api.loadProgress));
  }

  async function decodeFrame(i, { keep = false } = {}) {
    if (!blobs[i] || decoded.has(i) || pending.has(i) || destroyed) return;
    pending.add(i);
    try {
      const bmp = await decodeBlob(blobs[i]);
      if (destroyed || (!visible && !keep)) { bmp.close?.(); return; }
      decoded.set(i, bmp);
      if (i === current) render(true);
    } catch { /* ignoré */ } finally {
      pending.delete(i);
    }
  }

  async function decodeCoarse(i) {
    if (!blobs[i] || coarse.has(i) || destroyed) return;
    try {
      const bmp = await decodeBlob(blobs[i], { resizeWidth: COARSE_WIDTH, resizeQuality: 'low' });
      coarse.set(i, bmp);
      if (!lastDrawn || Math.abs(i - current) < COARSE_STEP) render(true);
    } catch {
      try { coarse.set(i, await decodeBlob(blobs[i])); } catch { /* ignoré */ }
    }
  }

  function evictAndPrefetch(i) {
    for (const k of decoded.keys()) {
      if (k < i - WINDOW_BEHIND - 4 || k > i + WINDOW_AHEAD + 4) {
        decoded.get(k).close?.();
        decoded.delete(k);
      }
    }
    for (let d = 0; d <= WINDOW_AHEAD; d++) if (i + d <= lastIndex) decodeFrame(i + d);
    for (let d = 1; d <= WINDOW_BEHIND; d++) if (i - d >= 0) decodeFrame(i - d);
  }

  const api = {
    scene, section, hasFrames, count,
    loaded: Promise.resolve(),
    /** Repère de progression (0..1). fn(true) en avançant, fn(false) en reculant. */
    cue(p, fn) { cues.push({ p, fn }); return api; },
    onProgress(fn) { progressListeners.push(fn); return api; },
    onLoad(fn) { loadListeners.push(fn); return api; },
    // En mouvement réduit une seule image est chargée : la progression est calculée sur 1.
    get loadProgress() { return hasFrames ? Math.min(1, fetched / (reduced ? 1 : count)) : 1; },
    destroy() {
      destroyed = true;
      abort.abort();
      trigger?.kill();
      tween?.kill();
      ro.disconnect();
      io.disconnect();
      [...decoded.values(), ...coarse.values()].forEach((b) => b.close?.());
      decoded.clear(); coarse.clear();
    },
  };

  // ---------- Taille du canvas (jamais lue dans la boucle de rendu) ----------
  const ro = new ResizeObserver((entries) => {
    const r = entries[0].contentRect;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.max(1, Math.round(r.width * dpr));
    ch = Math.max(1, Math.round(r.height * dpr));
    canvas.width = cw;
    canvas.height = ch;
    render(true);
  });
  ro.observe(canvas);

  // ---------- Visibilité : on suspend le travail hors écran ----------
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { evictAndPrefetch(current); render(true); }
    else { decoded.forEach((b) => b.close?.()); decoded.clear(); lastDrawn = -1; }
  });
  io.observe(section);

  // ---------- Fallback typographique : grand chiffre qui suit la progression ----------
  function setGhost(p) {
    if (hasFrames || !ghost) return;
    const v = Math.round(p * 100);
    if (v !== lastGhost) { lastGhost = v; ghost.textContent = pad(v); }
  }

  function dispatch(p) {
    for (const c of cues) {
      if (lastP < c.p && p >= c.p) c.fn(true);
      else if (lastP >= c.p && p < c.p) c.fn(false);
    }
    lastP = p;
    progressListeners.forEach((fn) => fn(p));
    setGhost(p);
  }

  // ---------- Pilotage par le scroll ----------
  const state = { frame: 0 };
  let tween = null;
  let trigger = null;

  if (!reduced) {
    tween = gsap.to(state, {
      frame: lastIndex,
      ease: 'none',
      snap: 'frame',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${mq('(max-width: 768px)').matches ? mobileEnd : end}%`,
        scrub,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        const idx = state.frame;
        if (idx !== current) {
          current = idx;
          if (hasFrames) { evictAndPrefetch(idx); render(); }
        }
        dispatch(idx / lastIndex);
      },
    });
    trigger = tween.scrollTrigger;
  }

  // ---------- Démarrage du chargement ----------
  if (hasFrames) {
    const stillIndex = Math.round(clamp(parseFloat(section.dataset.still ?? '0.9')) * lastIndex);
    if (reduced) {
      // Mouvement réduit : une seule image fixe, rien d'autre.
      api.loaded = fetchFrame(stillIndex).then(async () => {
        await decodeFrame(stillIndex, { keep: true });
        current = stillIndex;
        render(true);
      });
    } else {
      const order = [0];
      for (let i = COARSE_STEP; i < lastIndex; i += COARSE_STEP) order.push(i);
      order.push(lastIndex);
      const rest = [];
      for (let i = 0; i < count; i++) if (!order.includes(i)) rest.push(i);
      const run = async () => {
        await Promise.all(order.map((i) => fetchFrame(i)));
        if (destroyed) return;
        await Promise.all(order.map((i) => decodeCoarse(i)));
        evictAndPrefetch(0); // la première image exacte
        // Le reste en arrière-plan, 6 requêtes à la fois.
        let next = 0;
        const worker = async () => { while (next < rest.length && !destroyed) await fetchFrame(rest[next++]); };
        await Promise.all(Array.from({ length: 6 }, worker));
      };
      api.loaded = run();
    }
  } else {
    setGhost(0);
  }

  onCleanup(() => api.destroy());
  return api;
}
