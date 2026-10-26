# Barbier de la Cité (site de démonstration)

Site vitrine d'une page pour un barbier **fictif** de Lausanne, envoyé aux barbiers de la
ville comme exemple de ce que leur site pourrait être.

En ligne : <https://timoteoadrogue.github.io/barbier-de-la-cite/> (`noindex, nofollow`).
Un `git push` sur `main` republie.

## Ce qui est fictif

Le salon, l'équipe (Luca, Samir, Noah), l'histoire, les tarifs, les avis et la note.
L'adresse est un numéro inventé dans une vraie rue. Aucun numéro de téléphone n'est
affiché : le bouton « Appeler le salon » et la confirmation de réservation ouvrent une note
qui explique ce que ferait le vrai bouton. Le pied de page le dit aussi.

## Photos

Vraies photos, licence Unsplash (usage commercial libre, sans attribution obligatoire).
Les portraits de l'équipe sont passés en noir et blanc pour former une série. Pour un vrai
salon, il faut les remplacer par ses propres photos.

| Fichier | Source |
|---|---|
| `hero.jpg` | <https://unsplash.com/photos/a-man-getting-his-hair-cut-in-a-barber-shop-C4FeJ_3fmdo> |
| `coupe-court.jpg` | <https://unsplash.com/photos/a-man-getting-his-hair-cut-by-a-barber-xO8OpsasyZA> |
| `coupe-degrade.jpg` | <https://unsplash.com/photos/man-in-red-and-white-shirt-holding-black-smartphone-yG0Z9OwXWks> |
| `coupe-nuque.jpg` | <https://unsplash.com/photos/man-in-white-dress-shirt-holding-black-dslr-camera-m21YynrKdsw> |
| `serviette.jpg` | <https://unsplash.com/photos/a-man-getting-his-hair-cut-by-a-barber-Nh-A851W2ro> |
| `mousse.jpg` | <https://unsplash.com/photos/grayscale-photo-of-man-shaving-his-beard-Twd3yaqA2NM> |
| `salon.jpg` | <https://unsplash.com/photos/vintage-barber-chair-bathed-in-sunlight-near-doorway-4y50IXfnaIo> |
| `equipe-luca.jpg` | <https://unsplash.com/photos/shallow-focus-photo-of-man-holding-scissors-taZSJ6xmt48> |
| `equipe-samir.jpg` | <https://unsplash.com/photos/man-in-black-crew-neck-t-shirt-holding-white-bottle-T_gTN3Po9RQ> |
| `equipe-noah.jpg` | <https://unsplash.com/photos/man-in-black-nike-fitted-cap-holding-black-smartphone-bmIJtELt3Ck> |

## Ce que fait la page

- **Barre épinglée** : statut ouvert ou fermé calculé à l'heure de Lausanne
  (`Europe/Zurich`), quelle que soit l'heure du visiteur, mis à jour chaque minute.
  La rubrique en cours de lecture est soulignée.
- **Réservation en ligne** : prestation, barbier (avec photo), 6 prochains jours
  d'ouverture, créneaux de 30 minutes. L'agenda est simulé (créneaux pris stables d'une
  visite à l'autre). Cliquer un tarif ou « Réserver avec Luca » pré-remplit le formulaire.
- **Coupes récentes** : travelling horizontal épinglé sur grand écran, carrousel sur mobile.
- **Le fil** : des ciseaux descendent un pointillé le long du bord droit au rythme de la
  lecture, et changent de couleur selon le fond qui passe dessous.
- Thème clair et sombre (`prefers-color-scheme`), tout est immobile sous
  `prefers-reduced-motion`, et lisible sans JavaScript.

## Adapter pour un vrai salon

| Quoi | Où |
|---|---|
| Nom, adresse | `index.html` (barre, infos, pied) |
| Tarifs | `index.html` (`.carte-prix` **et** les `<option>` du formulaire) et `SERVICES` dans `main.js` |
| Horaires | tableau `.horaires`, pied de page **et** `HORAIRES` dans `main.js` |
| Équipe | `.equipe__liste`, puces `barbier` du formulaire, `BARBIERS` dans `main.js` |
| Réservation | remplacer le formulaire par l'intégration de l'agenda du salon (Planity, Fresha, Salonkee) |
| Téléphone | remplacer `data-demo="appel"` par `href="tel:+41..."` |
| Couleur | `--vert` dans `styles.css` |

Retirer `noindex` et la mention de démonstration seulement avec l'accord du salon.

## Structure

HTML, CSS et JS natifs, sans dépendance ni compilation. Police Archivo auto-hébergée
(OFL 1.1), chasse étendue pour l'enseigne et les titres. Icônes Phosphor et Simple Icons
dans un sprite en tête de page. Carte OpenStreetMap.

Tests : ouvrir la page avec `?test`, le résultat s'affiche en console (statut d'ouverture,
créneaux qui ne débordent pas de la fermeture ni ne tombent dans le passé).
