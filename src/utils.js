// Petits outils partagés : préférences, nettoyage des écouteurs, horaires d'ouverture.

export const mq = (q) => window.matchMedia(q);
export const reducedMotion = () => mq('(prefers-reduced-motion: reduce)').matches;
export const isFinePointer = () => mq('(hover: hover) and (pointer: fine)').matches;
export const isTouchLike = () => mq('(hover: none), (pointer: coarse)').matches;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const pad = (n, len = 3) => String(n).padStart(len, '0');

// ---- Nettoyage : tout écouteur enregistré avec listen() est retiré par cleanup() ----
const cleanups = [];
export const onCleanup = (fn) => { cleanups.push(fn); };
export function listen(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  onCleanup(() => target.removeEventListener(type, handler, options));
}
export function cleanup() {
  while (cleanups.length) {
    try { cleanups.pop()(); } catch { /* on continue le nettoyage */ }
  }
}

// ---- Horaires (fictifs), calculés à l'heure de Paris ----
// Clé : jour de la semaine (0 = dimanche). Valeur : [ouverture, fermeture] en minutes depuis minuit.
const hm = (h, m = 0) => h * 60 + m;
export const OPENING = {
  0: [hm(9), hm(13)],
  1: [hm(7, 30), hm(18)], 2: [hm(7, 30), hm(18)], 3: [hm(7, 30), hm(18)],
  4: [hm(7, 30), hm(18)], 5: [hm(7, 30), hm(18)],
  6: [hm(8, 30), hm(18)],
};
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const EN_DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { day: EN_DAYS[get('weekday')], minutes: +get('hour') * 60 + +get('minute') };
}

export function formatHM(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/** Renvoie { open, label, next, day } à partir d'une date réelle. */
export function getOpenStatus(date = new Date()) {
  const { day, minutes } = parisNow(date);
  const [from, to] = OPENING[day];
  if (minutes >= from && minutes < to) {
    return { open: true, label: 'Ouvert maintenant', next: `Jusqu'à ${formatHM(to)} aujourd'hui.`, day };
  }
  for (let offset = 0; offset <= 7; offset++) {
    const d = (day + offset) % 7;
    const [open] = OPENING[d];
    if (offset === 0 && minutes >= from) continue; // déjà passé aujourd'hui
    const when = offset === 0 ? "aujourd'hui" : offset === 1 ? 'demain' : DAY_NAMES[d];
    return { open: false, label: 'Fermé', next: `Prochaine ouverture : ${when} à ${formatHM(open)}.`, day };
  }
  return { open: false, label: 'Fermé', next: '', day };
}
