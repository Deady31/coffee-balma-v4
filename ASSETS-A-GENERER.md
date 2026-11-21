# Les 3 vidéos à générer

Le site fonctionne déjà avec des **placeholders** (dessins de test). Quand tu as une vraie vidéo, tu la déposes, tu lances une commande, c'est tout : aucun code à modifier.

## Réglages communs (n'importe quel générateur image → vidéo)
- Format **16:9**, durée **5 à 10 secondes**, **caméra fixe**, **sans texte, sans logo, sans son**, pas de main, pas de visage.
- Palette brune chaude, fond espresso très sombre, lumière chaude latérale, constante du début à la fin.
- Procédé : générer l'**image de départ** et l'**image de fin** avec un modèle d'image, puis demander la **transition** au générateur vidéo (début → fin).

## Scène 1 · `pour` (le hero), à faire en premier
- **Image de départ** : `Macro photograph, locked-off camera, an empty matte white ceramic cup on a dark walnut table, very dark espresso-brown background, sharp focus, warm soft side light from the left, subtle reflections, no text, no hands, photorealistic`
- **Image de fin** : `Same exact cup, same table, same camera, same lighting, the cup now full of a flat white with a clean leaf-shaped latte art, a thin trace of steam, no text, no hands, photorealistic`
- **Transition vidéo** : `Fixed macro camera. A thin steady stream of dark coffee pours slowly from the top of the frame into the white ceramic cup, the cup fills gradually until the leaf latte art forms, light steam appears at the end. The cup, table and lighting stay identical. No camera shake, no hands, no text.`

## Scène 2 · `grain`
- **Image de départ** : `Extreme close-up of roasted coffee beans on a dark surface, fixed camera, warm brown palette, soft side light, shallow depth of field, no text`
- **Image de fin** : `Top-down view of a full cup of black coffee on a dark surface, same warm brown palette and lighting, no text`
- **Transition vidéo** : `Fixed camera. The roasted coffee beans progressively and continuously transform into fine ground coffee, then into a full cup of coffee seen from above. Same warm brown palette, same lighting throughout. No text, no hands, no camera movement.`

## Scène 3 · `vapeur`
- **Image de départ** : `Wide shot, a cup of steaming coffee on a dark wood table, very dark espresso background, late-day warm light, calm mood, no text`
- **Image de fin** : `Same scene seen from slightly farther away, the cup smaller in the frame, soft steam dissipating, same lighting, no text`
- **Transition vidéo** : `Slow fixed wide shot, the camera very slowly pulls back (gentle zoom out). Steam rises from the cup and fades away. Late-afternoon warm light, dark espresso background. No text, no hands.`

## Checklist de validation (pour chaque vidéo)
- [ ] Le liquide a l'air réaliste (pas de gélatine, pas de lévitation).
- [ ] La tasse reste identique du début à la fin (forme, taille, position).
- [ ] Aucune main, aucun visage, aucun texte, aucun logo.
- [ ] Pas de tremblement de caméra.
- [ ] Éclairage constant, pas de scintillement.
- [ ] Début et fin cohérents avec les textes du site (vide → plein pour `pour`).

## Où la déposer et quoi lancer
1. Enregistre le fichier sous `assets/video/pour.mp4` (ou `grain.mp4`, `vapeur.mp4`).
2. `npm run frames -- pour` (ou `grain`, `vapeur`), ou `npm run frames:all` pour toutes celles qui existent.
3. Recharge la page (si `dist/` existe déjà, les images y sont copiées automatiquement, pas besoin de `npm run build`).
Le script affiche le poids obtenu (cible : moins de ~15 Mo par scène en desktop) et réduit tout seul fps/qualité si c'est trop lourd.

## Note honnête
Les limites des générateurs gratuits changent souvent : je ne les ai pas vérifiées, à tester. Plusieurs essais sont normaux pour obtenir un liquide crédible. Commence par la scène `pour`. Un brouillon pour `grain` existe peut-être déjà dans l'ancien site (`legacy/video/falling-beans.mp4`, grains qui tombent) : tu peux le copier en `assets/video/grain.mp4` pour tester le pipeline avec une vraie vidéo.
