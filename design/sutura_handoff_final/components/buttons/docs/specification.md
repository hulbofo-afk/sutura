# Spécification visuelle

## Hiérarchie

| Variante | Fond | Texte/icône | Usage |
|---|---|---|---|
| `primary` | Framboise `#E90046` | Blanc `#FFFFFF` | action principale unique |
| `yellow` | Jaune `#F5D500` | Prune `#4A2630` | accent ou action expressive |
| `secondary` | Rose pâle `#FCE8EB` | Prune `#4A2630` | action secondaire douce |
| `outline` | Transparent | Prune `#4A2630` | action secondaire structurée |
| `dark` | Prune `#4A2630` | Blanc `#FFFFFF` | action sur surface claire |
| `text` | Transparent | Framboise `#E90046` | action discrète |

## Tailles

| Taille | Hauteur | Padding horizontal | Usage |
|---|---:|---:|---|
| `large` | 52 dp | 20 dp | CTA principal, onboarding |
| `medium` | 48 dp | 18 dp | formulaires et écrans métier |
| `small` | 40 dp | 16 dp | cartes et listes |
| `compact` | 32 dp | 12 dp | actions secondaires très compactes |

Le composant conserve toujours une zone tactile d’au moins `48 dp`, même si la
surface visuelle est plus petite.

## États

- `default` : surface et texte normaux ;
- `loading` : libellé remplacé par un indicateur, action bloquée ;
- `success` : icône de validation et couleur conservées ;
- `disabled` : opacité réduite, aucun événement ;
- `pressed` : géré localement pendant `100 ms`, avec réduction visuelle légère.

## Typographie

Le composant utilise `Theme.of(context).textTheme.labelLarge`, avec un poids
`FontWeight.w600`. La police de marque doit être injectée dans le thème global,
pas déclarée localement dans le bouton.
