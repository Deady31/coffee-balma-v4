// Génère 3 vidéos de test (6 s) puis extrait les images. Les vraies vidéos
// déposées dans assets/video/<scene>.mp4 sont prioritaires : la scène est alors ignorée.
// Les images sont dessinées avec sharp (SVG) puis encodées par ffmpeg : aucune police système requise.
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { runFfmpeg } from './ffmpeg.mjs';
import { makeFrames, SCENES } from './make-frames.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1280, H = 720, FPS = 24, SECONDS = 6, N = FPS * SECONDS;
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const label = (i) => `
  <text x="40" y="${H - 36}" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" letter-spacing="4" fill="#F1E6D3" fill-opacity=".55">PLACEHOLDER · IMAGE ${String(i + 1).padStart(3, '0')}</text>`;

const bg = `
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2A1D15"/><stop offset="1" stop-color="#15100C"/></radialGradient>
    <linearGradient id="cup" x1="0" x2="1"><stop offset="0" stop-color="#E9DFCE"/><stop offset=".6" stop-color="#F4ECDD"/><stop offset="1" stop-color="#B9AE9B"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="blur2"><feGaussianBlur stdDeviation="5"/></filter>
    <clipPath id="inside"><path d="M470 360 H810 L780 560 Q640 600 500 560 Z"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect y="560" width="${W}" height="${H - 560}" fill="#0E0A07"/>`;

function cupBody() {
  return `<path d="M450 340 H830 L790 580 Q640 625 490 580 Z" fill="url(#cup)"/>
    <ellipse cx="640" cy="340" rx="190" ry="26" fill="#2A1D15"/>
    <path d="M826 380 q80 0 70 70 q-8 60 -70 60" fill="none" stroke="#E9DFCE" stroke-width="22" stroke-linecap="round"/>`;
}

const scenes = {
  pour(i) {
    const t = i / (N - 1);
    const level = ease(clamp(t / 0.9)); // 0..1
    const y = 560 - 190 * level; // niveau du liquide
    const stream = t < 0.88
      ? `<rect x="632" y="-10" width="16" height="${y + 10}" rx="8" fill="#4A2A18"/><rect x="636" y="-10" width="5" height="${y + 10}" fill="#7A4A2A" fill-opacity=".7"/>`
      : '';
    const leaf = t > 0.8
      ? `<g opacity="${clamp((t - 0.8) / 0.15)}" transform="translate(640 ${y + 6})"><ellipse rx="95" ry="14" fill="#EFE0C6"/><path d="M-60 0 Q0 -10 60 0" stroke="#4A2A18" stroke-width="4" fill="none"/></g>`
      : '';
    return `${bg}${cupBody()}
      <g clip-path="url(#inside)"><rect x="440" y="${y}" width="400" height="300" fill="#6B3E22"/><rect x="440" y="${y}" width="400" height="10" fill="#9A6038"/></g>
      ${stream}${leaf}
      <path d="M450 340 H830" stroke="#fff" stroke-opacity=".12"/>${label(i)}`;
  },
  grain(i) {
    const t = i / (N - 1);
    const r = rng(7);
    let g = '';
    // étape 1 : grains entiers, 2 : mouture, 3 : tasse vue de dessus
    const a1 = 1 - ease(clamp((t - 0.25) / 0.15));
    const a2 = ease(clamp((t - 0.25) / 0.15)) * (1 - ease(clamp((t - 0.62) / 0.15)));
    const a3 = ease(clamp((t - 0.62) / 0.15));
    let beans = '', dust = '';
    for (let k = 0; k < 70; k++) {
      const x = r() * W, y = r() * H, a = r() * 180, s = 0.8 + r() * 0.6;
      beans += `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><ellipse rx="40" ry="26" fill="#3B2314"/><path d="M-36 0 Q0 -8 36 0" stroke="#15100C" stroke-width="4" fill="none"/></g>`;
    }
    for (let k = 0; k < 900; k++) {
      dust += `<circle cx="${r() * W}" cy="${r() * H}" r="${1.5 + r() * 3}" fill="${r() > .5 ? '#4A2C19' : '#2E1B0F'}"/>`;
    }
    g += `<g opacity="${a1}">${beans}</g><g opacity="${a2}">${dust}</g>`;
    g += `<g opacity="${a3}"><circle cx="640" cy="360" r="250" fill="url(#cup)"/><circle cx="640" cy="360" r="205" fill="#6B3E22"/><circle cx="640" cy="360" r="205" fill="none" stroke="#9A6038" stroke-width="6"/><path d="M560 380 Q640 330 720 380 Q640 420 560 380" fill="#EFE0C6" fill-opacity=".8"/></g>`;
    return `${bg}${g}${label(i)}`;
  },
  vapeur(i) {
    const t = i / (N - 1);
    const zoom = 1.35 - 0.35 * ease(t);
    const r = rng(3);
    let steam = '';
    for (let k = 0; k < 6; k++) {
      const ph = (t * 1.2 + k / 6) % 1;
      const x = 600 + (k - 2.5) * 22 + Math.sin(ph * 6 + k) * 26;
      const y = 330 - ph * 300;
      steam += `<ellipse cx="${x}" cy="${y}" rx="${28 + ph * 40}" ry="${44 + ph * 50}" fill="#F1E6D3" fill-opacity="${0.35 * Math.sin(ph * Math.PI)}"/>`;
    }
    return `${bg}<g transform="translate(640 400) scale(${zoom}) translate(-640 -400)">${cupBody()}
      <ellipse cx="640" cy="340" rx="170" ry="20" fill="#6B3E22"/>
      <g filter="url(#blur)">${steam}</g></g>${label(i)}`;
  },
};

async function render(scene, dir) {
  const draw = scenes[scene];
  for (let i = 0; i < N; i += 8) {
    await Promise.all(
      Array.from({ length: Math.min(8, N - i) }, (_, k) => {
        const idx = i + k;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${draw(idx)}</svg>`;
        return sharp(Buffer.from(svg)).png({ compressionLevel: 1 }).toFile(join(dir, String(idx + 1).padStart(4, '0') + '.png'));
      })
    );
  }
}

async function main() {
  const out = join(ROOT, '.tmp');
  mkdirSync(out, { recursive: true });
  for (const scene of SCENES) {
    const real = join(ROOT, 'assets', 'video', `${scene}.mp4`);
    if (existsSync(real)) {
      console.log(`– ${scene} : une vraie vidéo existe (assets/video/${scene}.mp4), placeholder ignoré. Lance « npm run frames -- ${scene} ».`);
      continue;
    }
    console.log(`… ${scene} : génération du placeholder`);
    const dir = mkdtempSync(join(tmpdir(), `cb-ph-${scene}-`));
    try {
      await render(scene, dir);
      const mp4 = join(out, `placeholder-${scene}.mp4`);
      await runFfmpeg(['-y', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', mp4]);
      await makeFrames(scene, { input: mp4, placeholder: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

main().catch((e) => { console.error('Erreur :', e.message); process.exit(1); });
