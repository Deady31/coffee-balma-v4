// Trouve ffmpeg : d'abord la dépendance locale (ffmpeg-static), sinon le ffmpeg du système.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

let cached = null;

export async function getFfmpeg() {
  if (cached) return cached;
  try {
    const mod = await import('ffmpeg-static');
    const p = mod.default;
    if (p && existsSync(p)) return (cached = p);
  } catch { /* on tente le système */ }
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (r.status === 0) return (cached = 'ffmpeg');
  throw new Error(
    "ffmpeg introuvable. Lance « npm install » (ffmpeg-static se télécharge à l'installation) ou installe ffmpeg."
  );
}

/** Lance ffmpeg, renvoie { code, stderr }. */
export async function runFfmpeg(args, { input } = {}) {
  const bin = await getFfmpeg();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ['-hide_banner', '-loglevel', 'error', ...args], {
      stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ code, stderr });
      else reject(new Error(`ffmpeg a échoué (code ${code}) : ${stderr.trim().slice(-600)}`));
    });
    if (input) input(child.stdin);
  });
}

/** Lit durée, taille et fps d'une vidéo (ffmpeg -i écrit ces infos sur stderr). */
export async function probe(file) {
  const bin = await getFfmpeg();
  const r = spawnSync(bin, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const txt = r.stderr || '';
  const d = txt.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const s = txt.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})[\s,[]/);
  const f = txt.match(/(\d+(?:\.\d+)?)\s*fps/);
  if (!d || !s) throw new Error(`Impossible de lire la vidéo « ${file} » (fichier absent ou corrompu).`);
  return {
    duration: +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]),
    width: +s[1],
    height: +s[2],
    fps: f ? parseFloat(f[1]) : 24,
  };
}
