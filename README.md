# Barbier de la Cité (site de démonstration)

Site vitrine d'une page pour un barbier **fictif** de Lausanne. Il sert d'exemple à
envoyer aux barbiers de la ville : on remplace le nom, les tarifs, les horaires et les
photos par les leurs.

En ligne : <https://timoteoadrogue.github.io/barbier-de-la-cite/> (`noindex, nofollow`).
Un `git push` sur `main` republie.

## Ce qui est fictif

Le salon, l'adresse (numéro inventé dans une vraie rue), le téléphone `021 000 00 00`,
les tarifs, les avis et la note. Le pied de page et l'étiquette « Site de démonstration »
le disent. Les boutons « Réserver » ouvrent une note qui explique qu'ici s'ouvrirait
l'agenda du salon (Planity, Fresha, Salonkee…).

**Photos générées par IA, réduites au minimum** : `hero.jpg` (fauteuil vide),
`skinfade.jpg` (de dos), `taper.jpg` (de profil). Aucun visage de face. Les autres
cartes et la section « Nous trouver » sont typographiques, sans photo.

## Adapter pour un vrai salon

| Quoi | Où |
|---|---|
| Nom, adresse, téléphone | `index.html` (nav, hero, « Nous trouver », pied) |
| Tarifs | `index.html`, liste `.ardoise` |
| Horaires | tableau `.horaires` **et** objet `HORAIRES` dans `assets/js/main.js` |
| Bouton « Réserver » | remplacer `data-reserver` + `href` par le lien d'agenda, supprimer `.demo` et `#note-demo` |
| Couleur | `--accent` dans `assets/css/styles.css` |
| Photos | `assets/img/` (hero 16:9, deux coupes en portrait ou carré) |

Retirer `noindex` et la mention de démo seulement une fois le site validé par le salon.

## Structure

Même moteur que La Maison du Carac : HTML/CSS/JS natifs, aucune dépendance, polices
auto-hébergées (Bricolage Grotesque, axe de chasse utilisé à 75 %, et Instrument Sans,
OFL 1.1). Aucun écouteur de `scroll` : `IntersectionObserver` et une seule boucle
`requestAnimationFrame` (parallaxe du hero, rayures du poteau, travelling des coupes).
Sans JS tout reste lisible ; sous `prefers-reduced-motion`, rien ne bouge.

**Le fil** (indicateur de lecture) : des ciseaux descendent un pointillé « à découper »
le long du bord droit, le trait devient plein derrière eux et les lames s'ouvrent et se
ferment avec le défilement. Leur couleur suit le fond qui passe dessous (attribut
`data-fond` sur les sections et les cartes colorées). C'est le seul écouteur de `scroll`,
passif, limité à une mise à jour par image.

Test des horaires : ouvrir la page avec `?test`, le résultat s'affiche en console.
