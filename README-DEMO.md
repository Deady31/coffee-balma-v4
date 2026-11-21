# Coffee Balma v4 · mode d'emploi de la démo

> Café, adresse (« 12 rue de la Torréfaction », **rue inventée**), prix et horaires sont **fictifs**.

## Lancer (hors ligne)
1. Une fois : `npm install` puis `npm run build`.
2. Double-clic sur **`LANCER-LA-DEMO.bat`** (ou `npm run serve`) → http://localhost:4173.
3. Pour passer le préchargeur pendant tes tests : `http://localhost:4173/?skip`.
Le .bat construit le site tout seul s'il manque `dist/`. Il affiche un message clair si Node.js n'est pas installé.

## Ajouter tes vraies vidéos
Dépose `pour.mp4`, `grain.mp4`, `vapeur.mp4` dans `assets/video/`, puis `npm run frames:all` (ou `npm run frames -- pour`). Détails et prompts : `ASSETS-A-GENERER.md`. Sans vidéo : `npm run placeholder` régénère les images de test.

## Secours en ligne
Après `npm run build`, glisse le dossier **`dist/`** sur https://app.netlify.com/drop. **Teste le lien sur ton téléphone** (4G, pas le wifi de la salle) avant le 1er décembre.

## Contrôle automatique
`npm run test:e2e` (Playwright, si installé) : captures dans `screens/` à 0/25/50/75/100 % de chaque scène en 1440×900 et 390×844, canvas non vide, console propre, aucune requête externe, pas de défilement horizontal, test du fallback sans images.

## Checklist manuelle (si Playwright absent)
- [ ] F12 > Réseau : aucune requête hors `localhost`. Console : aucune erreur.
- [ ] Préchargeur : la tasse se remplit, le compteur va à 100, le rideau se lève ; clic sur la tasse = elle déborde.
- [ ] Hero : titre mot par mot, il se dissipe au premier scroll, « Torréfié à Balma » vers 40 %, bouton « Voir la carte » vers 85 %.
- [ ] Du grain à la tasse : 4 étapes, barre de progression à droite.
- [ ] Carte : survol = fond de la section qui change + carte flottante ; sur téléphone, un appui ouvre la note.
- [ ] Pastille Ouvert/Fermé cohérente avec l'heure à Paris.
- [ ] Mobile 390 px : pas de défilement horizontal, pas de curseur.
- [ ] Clavier : Tab visible partout, lien d'évitement, menu fermable avec Échap.
- [ ] Réglages système « réduire les animations » : pas de pin, pas de bandeau animé, image fixe.
- [ ] Changer d'onglet : le titre devient « Ton café refroidit… ».
- [ ] Débrancher le wifi : tout fonctionne.
