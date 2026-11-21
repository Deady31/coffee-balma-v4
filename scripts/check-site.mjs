// Contrôle automatique (Playwright) : captures, canvas non vide, console propre,
// aucune requête externe, pas de défilement horizontal sur mobile.
// Usage : npm run test:e2e   (le site doit être construit : npm run build ; le serveur est lancé ici)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error("Playwright est absent : fais le contrôle manuel décrit dans README-DEMO.md."); process.exit(2); }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'screens');
mkdirSync(OUT, { recursive: true });
const PORT = 4199;
const ORIGIN = `http://localhost:${PORT}`;
const PINNED = ['hero', 'grain', 'finale'];
const STEPS = [0, 0.25, 0.5, 0.75, 1];

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve-dist.mjs'), '--no-open', '--port', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

let failures = 0;
const fail = (m) => { failures++; console.log('  ✘', m); };
const ok = (m) => console.log('  ✔', m);

async function run(label, ctxOpts, { block = [] } = {}) {
  console.log(`\n== ${label}`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
  for (const b of block) await page.route(b, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"scenes":{}}' }));

  await page.goto(`${ORIGIN}/?skip`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const tag = label.split(' ')[0];

  // Position de chaque scène épinglée (pin-spacer) : début, longueur de scroll
  const info = await page.evaluate((ids) => ids.map((id) => {
    const el = document.getElementById(id);
    const sp = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
    const top = sp.getBoundingClientRect().top + scrollY;
    return { id, top, len: Math.max(0, sp.offsetHeight - innerHeight) };
  }), PINNED);

  for (const s of info) {
    for (const p of STEPS) {
      await page.evaluate((y) => scrollTo(0, y), s.top + p * s.len);
      await page.waitForTimeout(1100);
      const stat = await page.evaluate((id) => {
        const sec = document.getElementById(id);
        const c = sec.querySelector('canvas');
        if (sec.classList.contains('no-frames')) return { fallback: true };
        // On réduit le canvas à 16x16 puis on lit ces pixels (lecture sur un canvas à part).
        const probe = document.createElement('canvas');
        probe.width = probe.height = 16;
        const pc = probe.getContext('2d', { willReadFrequently: true });
        pc.drawImage(c, 0, 0, 16, 16);
        const px = pc.getImageData(0, 0, 16, 16).data;
        let min = 255, max = 0;
        for (let k = 0; k < px.length; k += 4) {
          const l = (px[k] + px[k + 1] + px[k + 2]) / 3; min = Math.min(min, l); max = Math.max(max, l);
        }
        return { range: Math.round(max - min), size: `${c.width}x${c.height}` };
      }, s.id);
      await page.screenshot({ path: join(OUT, `${tag}-${s.id}-${String(Math.round(p * 100)).padStart(3, '0')}.png`) });
      if (stat.fallback) { if (p === 0) ok(`${s.id} : fallback typographique actif`); }
      else if (stat.range < 12) fail(`${s.id} @${p * 100}% : canvas vide ou uni (${JSON.stringify(stat)})`);
      else if (p === 1) ok(`${s.id} : canvas dessiné (${stat.size}, contraste ${stat.range})`);
    }
  }
  // Sections hors pin
  for (const id of ['carte', 'compose', 'infos', 'footer']) {
    await page.evaluate((i) => document.getElementById(i).scrollIntoView(), id);
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(OUT, `${tag}-${id}.png`) });
  }
  const sw = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  sw.sw <= sw.iw ? ok(`pas de défilement horizontal (${sw.sw} <= ${sw.iw})`) : fail(`défilement horizontal : ${sw.sw} > ${sw.iw}`);
  external.length ? fail(`requêtes externes : ${external.join(', ')}`) : ok('aucune requête externe');
  errors.length ? fail(`console : ${errors.join(' | ')}`) : ok('console propre');
  await browser.close();
}

try {
  await run('desktop 1440x900', { viewport: { width: 1440, height: 900 } });
  await run('mobile 390x844', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await run('fallback (scènes sans images)', { viewport: { width: 1440, height: 900 } }, { block: ['**/frames/scenes.json'] });
} finally {
  server.kill();
}
console.log(failures ? `\n${failures} problème(s).` : '\nTout est vert.');
process.exit(failures ? 1 : 0);
