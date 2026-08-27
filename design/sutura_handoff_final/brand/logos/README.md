# Sutura — Logo system

Déclinaisons préparées pour le handoff final de l’application Flutter.

## Palette

| Nom | Valeur | Usage |
|---|---|---|
| Framboise | `#E90046` | couleur signature, logo principal, CTA |
| Jaune | `#F5D500` | accent et variante expressive |
| Prune | `#4A2630` | contraste, fonds sombres |
| Rose pâle | `#FCE8EB` | surface de respiration |
| Noir | `#101418` | version monochrome et texte |
| Blanc | `#FFFFFF` | fonds framboise/prune et dark mode |

## Règles d’utilisation

- Utiliser le wordmark complet sur le splash, l’authentification, les confirmations et les supports de marque.
- Utiliser le symbole `S` dans la navigation privée, les avatars, les notifications et les conteneurs compacts.
- Utiliser `app-icon-framboise-1024.png` comme icône principale de l’application.
- Conserver les fichiers `*-transparent.png` sur les fonds contrôlés par l’interface.
- Ne jamais étirer, incliner, ajouter une ombre ou appliquer un gradient au logo.
- Garder une zone de protection minimale équivalente à la hauteur du trait supérieur du symbole autour du logo.

## Fichiers

- `wordmark-*` : logo Sutura complet, fond transparent.
- `symbol-s-*` : symbole S seul, fond transparent.
- `app-icon-*` : icônes carrées prêtes pour l’application.
- `favicon-*` : petites tailles pour usage web et documentation.
- `logo-variants-preview.png` : planche de contrôle visuel.

## Source de vérité

Les fichiers canoniques sont ceux de ce dossier : `wordmark-*`, `symbol-s-*`,
`app-icon-*` et `favicon-*`. Les anciens fichiers de démonstration éventuellement
présents dans les dossiers d’audit ne doivent pas être utilisés dans l’application.
Toutes les couleurs principales des assets canoniques correspondent exactement
aux hexadécimales ci-dessus ; les pixels semi-transparents des PNG peuvent varier
uniquement à cause de l’anticrénelage des contours.

Les PNG sont exportés avec transparence lorsque le nom contient `transparent`.
