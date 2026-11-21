// Vidéo -> séquence d'images WebP (desktop 1600 px, mobile 720 px) + manifest.json
// Usage : npm run frames -- pour      |   npm run frames:all
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { runFfmpeg, probe } from './ffmpeg.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SCENES = ['pour', 'grain', 'vapeur'];
const DESKTOP_W = 1600;
const MOBILE_W = 720;

const mo = (b) => (b / 1024 / 1024).toFixed(1);
const even = (n) => Math.max(2, Math.round(n / 2) * 2);

async function encodeAll(files, width, quality, pick) {
  const out = new Array(pick.length);
  let bytes = 0;
  for (let i = 0; i < pick.length; i += 8) {
    const chunk = pick.slice(i, i + 8);
    const bufs = await Promise.all(
      chunk.map((idx) =>
        sharp(files[idx]).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 4 }).toBuffer()
      )
    );
    bufs.forEach((b, k) => { out[i + k] = b; bytes += b.length; });
  }
  return { bufs: out, bytes };
}

function subset(n, keep) {
  if (keep >= n) return Array.from({ length: n }, (_, i) => i);
  return Array.from({ length: keep }, (_, i) => Math.round((i * (n - 1)) / (keep - 1)));
}

export async function makeFrames(scene, opts = {}) {
  const {
    input = join(ROOT, 'assets', 'video', `${scene}.mp4`),
    fps: wantedFps = 24,
    max = 240,
    quality = 75,
    budgetMB = 15,
    placeholder = false,
  } = opts;
  if (!existsSync(input)) throw new Error(`Vidéo absente : ${input}`);

  const info = await probe(input);
  let fps = wantedFps;
  if (info.duration * fps > max) {
    fps = Math.floor((max / info.duration) * 100) / 100;
    console.log(`  ${scene} : vidéo longue (${info.duration.toFixed(1)} s), fps réduit à ${fps} pour rester sous ${max} images.`);
  }

  const tmp = mkdtempSync(join(tmpdir(), `cb-${scene}-`));
  try {
    await runFfmpeg([
      '-i', input,
      '-vf', `fps=${fps},scale='min(${DESKTOP_W},iw)':-2:flags=lanczos`,
      '-frames:v', String(max),
      '-q:v', '2',
      join(tmp, '%04d.jpg'),
    ]);
    const files = readdirSync(tmp).filter((f) => f.endsWith('.jpg')).sort().map((f) => join(tmp, f));
    if (!files.length) throw new Error('Aucune image extraite.');

    // Ajuste qualité puis nombre d'images jusqu'à passer sous le budget desktop.
    const attempts = [
      [quality, 1], [quality - 10, 1], [quality - 20, 1], [quality - 30, 1],
      [quality - 20, 0.75], [quality - 30, 0.6], [quality - 30, 0.5],
    ];
    let result = null;
    for (const [q, factor] of attempts) {
      const pick = subset(files.length, Math.max(2, Math.floor(files.length * factor)));
      const d = await encodeAll(files, DESKTOP_W, q, pick);
      result = { q, pick, d };
      if (d.bytes / 1048576 <= budgetMB) break;
      console.log(`  ${scene} : ${mo(d.bytes)} Mo (> ${budgetMB} Mo) avec qualité ${q}, j'ajuste…`);
    }
    const { q, pick, d } = result;
    const m = await encodeAll(files, MOBILE_W, q, pick);
    const effFps = Math.round(fps * (pick.length / files.length) * 100) / 100;
    if (d.bytes / 1048576 > budgetMB) console.log(`  ATTENTION ${scene} : ${mo(d.bytes)} Mo, au-dessus de la cible de ${budgetMB} Mo.`);

    const dir = join(ROOT, 'public', 'frames', scene);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(join(dir, 'desktop'), { recursive: true });
    mkdirSync(join(dir, 'mobile'), { recursive: true });
    const name = (i) => String(i + 1).padStart(4, '0') + '.webp';
    d.bufs.forEach((b, i) => writeFileSync(join(dir, 'desktop', name(i)), b));
    m.bufs.forEach((b, i) => writeFileSync(join(dir, 'mobile', name(i)), b));

    const dm = await sharp(d.bufs[0]).metadata();
    const mm = await sharp(m.bufs[0]).metadata();
    const manifest = {
      scene,
      count: pick.length,
      width: dm.width,
      height: dm.height,
      fps: effFps,
      sourceFps: info.fps,
      desktop: { width: dm.width, height: dm.height },
      mobile: { width: mm.width, height: mm.height },
      quality: q,
      placeholder,
    };
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`✔ ${scene} : ${manifest.count} images, desktop ${mo(d.bytes)} Mo, mobile ${mo(m.bytes)} Mo (qualité ${q}, ${effFps} i/s)`);
    return { scene, count: manifest.count, desktopMB: +mo(d.bytes), mobileMB: +mo(m.bytes) };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

async function cli() {
  const args = process.argv.slice(2);
  const flag = (n, def) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? Number(args[i + 1]) : def;
  };
  const opts = { fps: flag('fps', 24), max: flag('max', 240), quality: flag('quality', 75), budgetMB: flag('budget', 15) };
  const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));

  if (args.includes('--all')) {
    let done = 0;
    for (const s of SCENES) {
      if (!existsSync(join(ROOT, 'assets', 'video', `${s}.mp4`))) {
        console.log(`– ${s} : pas de assets/video/${s}.mp4, ignorée.`);
        continue;
      }
      await makeFrames(s, opts);
      done++;
    }
    if (!done) console.log("Aucune vidéo trouvée dans assets/video/. Lance « npm run placeholder » pour des vidéos de test.");
    return;
  }
  const scene = positional[0];
  if (!SCENES.includes(scene)) {
    console.error(`Usage : npm run frames -- <${SCENES.join('|')}>   ou   npm run frames:all`);
    process.exit(1);
  }
  await makeFrames(scene, opts);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().catch((e) => { console.error('Erreur :', e.message); process.exit(1); });
}
