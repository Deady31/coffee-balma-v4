import { defineConfig } from 'vite';

// Chemins relatifs : dist/ fonctionne servi depuis n'importe quel dossier (serveur local, Netlify Drop).
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 700 },
});
