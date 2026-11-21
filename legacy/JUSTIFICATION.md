# Coffee Balma, niveau 3 : justification des choix

Marque, prix, avis, fiches café, origines, lots et personnages (dont Inès Calmette) sont fictifs. Projet de démonstration, signalé comme tel dans la page. Pensé pour une démonstration sur ordinateur.

## Cible
Particuliers de 25 à 45 ans, urbains, qui veulent mieux boire leur café à la maison sans être experts.

## Problème
Trop de choix, peur de se tromper, café de supermarché sans goût.

## Réponse
| Problème client | Réponse dans la page |
|---|---|
| Trop de choix | 3 cafés, un seul prix (9,90 € les 250 g), un clair, un moyen, un foncé |
| Peur de se tromper | Roue des saveurs qui recommande, quiz de 4 questions qui rend un ticket (café, mouture, recette), fiches façon encyclopédie |
| Café sans goût | Le voyage du grain à la tasse montre la fraîcheur : fournées de 6 kg, repos, expédition sous 48 h |
| Peur de mal préparer | Comptoir de préparation : dose, eau, température, mouture, durée, extraction animée |
| Hésitation à s'engager | Abonnement sans engagement, boîte qui se remplit, étiquette de sachet à votre nom, prix et économie en direct |

Une seule action principale, « Je m'abonne », qui mène à une page dédiée.

## Parcours de vente : une vitrine, un tunnel
- **Vitrine (`index.html`)** : raconte et rassure. Ordre pensé pour convaincre vite : accueil, bandeau de rassurance (sans engagement, torréfié à la commande, envoi sous 48 h, note d'exemple), savoir-faire, trois cafés, « comment ça marche » en trois gestes, avis, puis le récit du grain à la tasse et les outils d'aide au choix (roue, quiz, origines, comptoir). Un appel à l'action revient après chaque bloc fort, avec le prix (9,90 €) et la promesse (sans engagement).
- **Tunnel (`abonnement.html`)** : une page sans distraction, uniquement pour s'abonner. En-tête allégé avec une barre d'étapes qui avance toute seule (1. Formule, 2. Votre boîte, 3. Coordonnées), carton interactif et total collants pendant la saisie, formulaire minimal (prénom, e-mail), pastille « Le plus choisi » sur la formule à deux sachets, rassurance sous le bouton, mini-FAQ et avis avant de valider, écran de confirmation avec les trois prochaines étapes datées.
- **Rétention :** « Je le choisis » sur un café, ou dans la fiche et le quiz, préremplit le carton de la page d'abonnement. La composition est mémorisée dans le navigateur (stockage local, jamais envoyée) : au retour, on propose de la reprendre, et la touche de la barre devient « Reprendre ma boîte ».
- **Transition :** les trois nappes cuivre recouvrent l'écran depuis le clic, la page change, elles se retirent.

## Direction artistique : la torréfaction de nuit, en plat sobre
- **Parti pris :** torréfaction de nuit, cases néo-brutalistes, accent cuivre. Chaque café a son propre monde de couleur, tiré de son paquet : vert sauge, terracotta, bleu nuit.
- **Cases néo-brutalistes :** chaque bloc de texte (points du savoir-faire, avis, questions, formulaire, ticket, étiquette) a un contour épais de 3 px, une ombre dure décalée sans flou, un fond plein et une légère inclinaison. Les couleurs alternent (cuivre, crème, sauge, brun) ; au survol la case se soulève, la question ouverte de la FAQ passe en cuivre plein. Même langage que les touches : aplats, contours francs, relief dessiné.
- **Touches de clavier dessinées :** tous les boutons et contrôles cliquables sont des touches : face dégradée, tranche épaisse, contour d'encre irrégulier, petit reflet tracé à la main. Le texte ne bouge pas. Au clic, la touche s'enfonce de 4 px (la tranche disparaît) comme une vraie touche ; les choix sélectionnés restent enfoncés et passent en cuivre.
- **Vidéo d'accueil :** une vidéo de grains qui tombent au ralenti (fournie, 2 Mo) joue en boucle sous le titre, avec l'image fixe en repli. Elle se met en pause hors écran et disparaît en mouvement réduit.
- **Titre liquide :** « COFFEE BALMA » est un shader WebGL (principe de liquid-logo, MIT) en cuivre fondu, que l'on attrape et étire comme un élastique.
- **Horaires fictifs** dans la section « Passez à l'atelier » et en pastille dans la barre du haut, avec statut ouvert / fermé à l'heure de Paris.
- **Transition liquide :** le bouton « Je m'abonne » recouvre l'écran de trois nappes cuivre qui s'étalent depuis le clic, la page saute, puis elles se retirent.
- **Performance :** défilement natif (plus de détournement de la molette), pas de flou ni d'ombre portée sur les éléments qui bougent, titre WebGL à 15 images par seconde au repos et arrêté hors de l'accueil, vidéo non chargée sur les machines modestes.
- **Fonds vivants :** un fond fixe (photo de grains floutée, vignette, grain de papier) sous une teinte qui passe du vert du grain cru au blond, au cuivre puis au presque noir. Par section : lueurs colorées, mot fantôme en contour, grains PNG flous en parallaxe. Un thermomètre fixe sur le bord droit indique la température et la phase.
- **Règle typographique :** Butler (Fabian De Smet, via DaFont), serif élégante à fort contraste, pour tous les titres de section (en capitales, espacées) et pour les textes : le ton premium d'un torréfacteur. Matcha World, ronde et chaleureuse, est réservée à un seul usage : le gros titre « COFFEE BALMA » de l'accueil.
- **Matières :** grains, kraft des sachets. Un seul moment clair : le ticket du quiz, en papier sur fond kraft incliné, et l'étiquette de sachet, objets réels posés sur le fond sombre.

## Composants originaux, liés au métier
1. **Titre liquide et élastique** : « COFFEE BALMA » est un shader WebGL cuivre fondu à gauche de l'accueil, que l'on attrape et étire ; à droite, l'accroche, la fournée du jour et les deux boutons.
2. **Plongée dans les grains** (scène épinglée) : de vrais grains photographiques (PNG fourni, fond détouré) passent devant la caméra, parallaxe à la souris, accroche finale. Le même grain sert partout : séparateurs du bandeau, torréfaction qui change de teinte, carte du monde.
3. **Du grain à la tasse** (scène épinglée, 5 étapes) : fenêtres rectangulaires qui se révèlent par `clip-path`, navigation par boutons, courbe de torréfaction réelle avec trois profils.
4. **Cafés en pile collante, un design chacun :** trois panneaux pleine hauteur qui se recouvrent, chacun avec son paquet détouré (PNG fourni), sa couleur, son mot fantôme (Éthiopie, Colombie, Sumatra), son texte dans une case néo-brutaliste teintée et un titre à la direction artistique propre : L'AUBE en Bodoni fin et dégradé crème-sauge sous un soleil levant, LE ZÉNITH en Bebas Neue monumental à relief rétro sous un soleil au plus haut, LA NUIT en Optimus Princeps espacé, lueur de lune et croissant. Le paquet s'incline avec la souris.
5. **Transitions lisses :** défilement avec inertie, ancres et boutons de scène qui glissent, révélation douce des titres et des blocs à l'arrivée, bandes de couleur (quiz, cafés, pied de page) qui se fondent par dégradé au lieu de couper net.
6. **Roue des saveurs** : 9 notes réparties sur les 3 cafés, 4 familles ; elle compte les notes de chaque café et recommande.
7. **Comptoir de préparation** : 4 méthodes, dose au gramme, ratio, température ajustée à la torréfaction, mouture en micromètres, minuteur avec balance.
8. **Carte des origines en grains** : fond de carte Natural Earth rempli de vrais grains dessinés (environ 8 000), zoom animé sur chaque origine, trajet jusqu'à Balma, distance calculée, calendrier de récolte.
9. **Carton interactif :** un vrai carton PNG (détouré, filigrane retiré) dans lequel les sachets détourés choisis tombent, glissent derrière le rabat avant et dépassent par le haut ; retirer un sachet le fait ressortir, les places vides sont en pointillés, un tampon « Boîte complète » apparaît.
10. **Étiquette de sachet vivante** : prénom, date de torréfaction, date limite, lot, mouture et recette se mettent à jour pendant que l'on remplit la boîte et le formulaire.
11. **Carrousel de polaroïds sur un fil** (composant `polaroid-line-carousel` fourni, porté en JavaScript natif) : les trois cafés, la boîte, l'atelier et la cerise pendent à une corde qui s'affaisse, balancent selon la vitesse, glissent au doigt, à la souris, aux flèches ou en lecture automatique.
12. **Atelier et horaires** : plan stylisé de Balma, horaires fictifs avec statut ouvert / fermé calculé à l'heure de Paris (aussi en pastille dans la barre), fournée du jour dans l'accueil.
13. **Quiz en ticket** qui débouche sur le comptoir et l'abonnement préremplis.

Références de motifs : fiche de dégustation et courbe SVG qui se dessine au défilement, pile de cartes collante, rideau, bouton à remplissage directionnel (vocabulaire du skill taste-skill).

## Accessibilité
- Contrastes vérifiés sur fond sombre (crème `#f4ead9` sur espresso `#110905`, cuivre `#e8975a`, texte `#1a0f09` sur cuivre). Lighthouse : 100.
- Cibles de 48 px minimum, focus visible, lien d'évitement, navigation clavier complète, fiches en `<dialog>` natif.
- Roue et carte : les contrôles accessibles sont des boutons (chips, onglets) ; le dessin sert à la souris et au toucher.
- Scènes épinglées : texte dans l'ordre du DOM, étapes cachées retirées de la tabulation, boutons pour changer d'étape.
- `prefers-reduced-motion` : pas d'animation d'arrivée, pas de scène épinglée ni de pile, fond uni, tout est empilé et visible.
- Formulaire : étiquettes liées, erreurs annoncées, aucune donnée envoyée ni enregistrée, pas de cookie. Le prénom saisi n'apparaît que sur l'étiquette, échappé.

## Mesures (Lighthouse, ordinateur, serveur local)
| Performance | Accessibilité | Bonnes pratiques | SEO | Décalage |
|---|---|---|---|---|
| Accueil : 97 / Abonnement : 99 | 100 / 100 | 100 | 100 | 0,08 / 0,06 |

Poids transféré : environ 470 Ko. Animations de défilement limitées à `transform`, `opacity` et `clip-path`, sans bibliothèque. Les sections sous l'écran utilisent `content-visibility`, la carte en grains se dessine à l'approche.

## Limites assumées
- **Matcha World : police fournie pour le projet, usage personnel uniquement.** Acceptable pour un exercice, à remplacer par des versions licenciées avant toute publication commerciale.
- La version téléphone existe mais n'a pas été retravaillée pour cette démonstration. Le thermomètre est masqué sous 1000 px.
- Photos fournies pour le projet, au rendu un peu lisse. Données de torréfaction, lots et trajets plausibles mais inventés.
- Pas de vidéo d'en-tête : le dossier `video/` n'existe pas.
- Les étiquettes des paquets fournis portent les noms Soleil Levant, Crépuscule et Nocturne, alors que la page nomme les cafés L'Aube, Le Zénith et La Nuit (mêmes origines). Les paquets détourés sont dans `images/packs/` (PNG à fond transparent, résolution d'origine).

## Trois lignes sur les choix de design
1. Le site est une fournée : fond espresso, courbe de torréfaction qui s'écrit à l'arrivée, couleur et thermomètre qui montent avec le défilement.
2. Le style est plat et franc : cases néo-brutalistes à ombre dure, un seul cuivre, des touches de clavier qui s'enfoncent.
3. Un seul geste principal, « Je m'abonne », et l'étiquette de sachet à votre nom rend l'abonnement concret avant même de le valider.

## Sources et licences
- Fond de carte : Natural Earth, domaine public.
- Barlow Condensed : Jeremy Tribby, SIL Open Font License.
- Butler (Fabian De Smet, licence jointe dans `fonts/Butler-EULA.pdf`), Matcha World, vidéo de grains, grain de café PNG, logo et photos : fournis pour le projet.
