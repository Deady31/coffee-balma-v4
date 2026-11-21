# Notes de construction et hypothèses
- **Ancien site** : cloné depuis github.com/Deady31/CoffeeBalma (`git clone --depth 1`, `.git` supprimé) dans `legacy/`, jamais modifié. C'est le seul « niveau 3 » disponible (il n'y avait pas de dossier local à comparer).
- **Placeholders** : dessinés avec `sharp` (SVG) puis encodés par ffmpeg (x264). Choix fait parce que le ffmpeg embarqué (`ffmpeg-static`) n'a pas le filtre `drawtext`. Largeur 1280 px : le desktop des placeholders est donc 1280 px, pas 1600. Les vidéos réelles sont extraites à 1600 px.
- **Placeholders écrits dans `.tmp/`** (ignoré par git) pour ne jamais écraser une vraie vidéo de `assets/video/`.
- **Images placeholder commitées** dans `public/frames/` (≈ 7 Mo) pour que `git clone` + `npm run build` donne un site complet. Les vraies images, plus lourdes, sont à toi de commiter ou non.
- **`scenes.json`** : le site lit `frames/scenes.json` (liste des scènes + manifestes) au lieu de tester chaque dossier : une scène absente ne génère aucune erreur 404 en console. `make-frames` le met à jour et copie les images dans `dist/` si déjà construit.
- **Mémoire** : le moteur garde les images compressées et ne décode qu'une fenêtre autour de l'image courante (+ vignettes grossières 720 px toutes les 12 images). 240 images 1600 px décodées pèseraient > 1 Go.
- **Préchargeur** : le compteur suit le chargement réel de TOUTES les images de la scène `pour`, jamais plus vite que 1,2 s. Garde-fou : après 15 s, le rideau se lève avec la valeur réelle du moment.
- **`snap: 'frame'`** vérifié dans GSAP 3.15 (le résultat est bien entier).
- **Contraste** : `--ember` ajusté de `#B5481F` à `#A8411B` (4,35:1 → 4,95:1 sur crema). `npm run` n'a pas de commande dédiée : `node scripts/check-contrast.mjs`.
- **Polices** : Fraunces (opsz + italique) et DM Sans, locales via @fontsource-variable. Les sous-ensembles latin-ext/vietnamien sont dans `dist/` mais ne sont téléchargés que si un caractère les demande.
- **Playwright** : déjà installé sur la machine de session (global), utilisé par `npm run test:e2e` ; non ajouté aux dépendances du projet. Si absent, voir la checklist manuelle de README-DEMO.md.
- **Fichiers .bat** : écrits mais non testables ici (Linux). À tester sur ton PC Windows.
- **Cible tactile** : boutons ≥ 44 px ; rangées de la carte ≥ 56 px.
- **Non fait** : aucun point P0/P1/P2 abandonné. Limite connue : les placeholders ne montrent pas le vrai rendu (liquide, texte lisible sur image claire) ; à revalider avec les vraies vidéos.

## Auto-critique « anti-slop » (les 5 choses les plus génériques, corrigées)
1. Titre de finale centré/orphelin (« d' » seul sur une ligne) → bloc aligné à droite, « d'une tasse » insécable.
2. Trois cartes identiques → aucune : la carte est une liste typographique, les infos sont en grille asymétrique de largeurs différentes.
3. Tout centré → titres alignés à gauche, sous-titre en bas à gauche, bouton à droite, finale à droite.
4. Dégradés/verre → aucun dégradé violet ou bleu, aucun flou de verre ; seuls des dégradés brun→crème de raccord entre sections.
5. Icônes emoji → aucun emoji ; tasse dessinée en SVG au trait. Éléments qui débordent volontairement : tasse du configurateur, « 12 » géant, « BALMA » rogné.
Mots interdits (« Découvrez », « innovant », « passionnés », « expérience unique ») : absents (vérifié par recherche).
