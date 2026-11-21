# AUDIT : site « niveau 3 » (legacy/, cloné depuis github.com/Deady31/CoffeeBalma, lecture seule)
**Contenu.** 2 pages : `index.html` (vitrine, ~15 blocs) et `abonnement.html` (tunnel). Torréfacteur-abonnement : 3 cafés (Soleil Levant, Crépuscule, Nocturne) à 9,90 € les 250 g, avis fictifs, roue des saveurs, quiz, carte des origines, comptoir de préparation, carrousel polaroïds, atelier + horaires avec statut ouvert/fermé (heure de Paris).
**Palette / polices.** Fond `#110905`, crème `#f4ead9`, cuivre `#e8975a`, rouille `#b3441b`. Butler, Matcha World (licence perso), Bebas, Bodoni, Optimus, Manrope, JetBrains Mono : 8 polices.
**Interactions.** Titre WebGL liquide, scènes épinglées maison, cartes néo-brutalistes inclinées, touches de clavier dessinées, nappes de transition, fonds vivants.
**Je garde (texte/données).** Ton court et concret ; « Torréfié à Balma » ; les étapes grain → torréfaction → repos → tasse (réécrites pour 4 étapes) ; les notes de dégustation (agrumes, miel, caramel, noisette, cacao noir, épices) ; la logique « Ouvert maintenant » calculée à l'heure de Paris ; le principe « fournées de 6 kg ». Le prompt/contenu de la section 8 prévaut pour carte, prix et horaires.
**Je jette.** Abonnement, avis, quiz, roue, carte des origines, comptoir, carrousel, WebGL, Matcha World (licence), 7 polices sur 8.
**Médias.** `video/falling-beans.mp4` (1080p, 10 s, 2 Mo) : non utilisé (consigne : placeholders seulement), mais exploitable plus tard comme brouillon de la scène `grain` (copie en `assets/video/grain.mp4`). Images `images/opt/*` non reprises (style photo lisse, autre direction artistique).
**Page abonnement.** Le nouveau site reste une seule page. Proposition : ne pas la reconstruire ; elle reste dans `legacy/` (plan B). Un simple mot « À emporter » dans le bandeau et dans les infos pratiques suffit pour un café de quartier.
**Décision.** Projet neuf (Vite, canvas scrub, pipeline images) ; pas de refactorisation de l'ancien fichier. Aucune raison forte de décider autrement.
**5 défauts « look IA / template » de l'ancien site.**
1. Tout est cuivre sur brun nuit : une seule ambiance, pas de respiration claire.
2. Cases néo-brutalistes inclinées en série (savoir-faire, avis, FAQ) : motif répété 3 fois, effet « kit de composants ».
3. Trop de modules (13) : chaque gadget fait « waouh » seul, mais le récit se dilue.
4. Titres en capitales espacées partout, avec mots fantômes en contour : maniérisme systématique.
5. Chiffres et avis « d'exemple » alignés en trois colonnes identiques (3 cafés, 3 avis, 3 gestes) : structure de template.
