# Sutura — Brand system

## 1. Idée de marque

Sutura transforme l’intuition d’un créateur en décisions éclairées. La marque doit être sensible et précise : la chaleur vient de la matière et de la photographie ; la confiance vient de la structure et de la lisibilité.

### Voix

Chaleureuse, concise, experte sans jargon. Le produit dit « Ta collection est prête à être testée » plutôt que « Créez votre test ». Les erreurs donnent une solution immédiate.

### À éviter

Interfaces entièrement rose bonbon, gradients permanents, motifs africains génériques, chiffres sans interprétation, cartes qui ressemblent à un back-office SaaS, titres en capitales longues.

## 2. Identité visuelle

Le logo wordmark est réservé au splash, à l’authentification, à la confirmation et aux supports de marque. Dans la navigation privée, utiliser le symbole S dans un conteneur compact. Le logo ne doit jamais être étiré, recoloré avec un effet ou posé sur une image sans contraste suffisant.

Le terracotta devient la couleur de signature. Le rose blush reste une couleur de respiration et non la couleur dominante de toute l’application.

## 3. Palette sémantique

| Token | Valeur | Usage |
|---|---|---|
| `ink.900` | `#241F1C` | texte principal, navigation active |
| `ink.700` | `#554B46` | texte secondaire fort |
| `ink.500` | `#867A73` | métadonnées, placeholders |
| `canvas` | `#FCF9F6` | fond principal |
| `surface` | `#FFFFFF` | cartes et champs |
| `clay.700` | `#9B482D` | CTA, logo, liens importants |
| `clay.500` | `#C86A4A` | accent, illustrations, focus |
| `clay.100` | `#F4DED4` | surfaces sélectionnées |
| `blush.100` | `#F9E9E7` | blocs doux, onboarding |
| `sage.700` | `#356451` | succès, publié, signal positif |
| `amber.700` | `#9A6218` | brouillon, attention |
| `red.700` | `#B33A35` | erreur, suppression |
| `line` | `#E9DED8` | bordures et séparateurs |

## 4. Typographie

- **Display** : Cormorant Garamond Semibold, pour les titres de marque et grands chiffres.
- **Interface** : Plus Jakarta Sans, pour tous les labels, boutons, données et textes d’aide.
- Échelle : `display 36/40`, `h1 28/32`, `h2 22/28`, `h3 17/24`, `body 15/22`, `small 12/16`.
- Les boutons et labels utilisent une casse phrase, jamais des capitales forcées.

## 5. Photographie et texture

Les photos de modèles sont nettes, verticales et respirantes. Le textile peut apparaître dans les headers, les empty states et les transitions, avec une opacité faible. Une photo est toujours recadrée avec `BoxFit.cover` et un point focal défini ; ne pas laisser Flutter choisir un crop arbitraire.

## 6. Motion

Motion discrète : 180 ms pour les micro-interactions, 260 ms pour les cartes et panneaux, courbe `easeOutCubic`. Le splash est limité à 900 ms maximum. Aucun loader ne doit bloquer un écran sans contexte ; préférer des skeletons structurés.
