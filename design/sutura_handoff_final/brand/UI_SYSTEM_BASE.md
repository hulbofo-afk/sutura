# Sutura — UI system

## Grille et dimensions

- Cibles : Android 360, 390 et 430 dp de large.
- Padding horizontal écran : 20 dp ; 16 dp sous 375 dp de largeur.
- Grille d’espacement : 4, 8, 12, 16, 20, 24, 32, 40.
- Touch target minimal : 48 × 48 dp.
- Rayon : `sm 10`, `md 14`, `lg 20`, `pill 999`.
- Ombre : une seule ombre douce, faible élévation ; les séparations utilisent d’abord la couleur `line`.

## Navigation

Navigation privée en quatre destinations : **Accueil**, **Collections**, **Tests**, **Profil**. La création contextuelle se fait avec un bouton flottant ou un CTA dans la vue courante ; pas de cinquième onglet ambigu.

La barre de navigation reste visible sur les écrans racine. Les écrans de création, détail et réponse utilisent une barre supérieure avec retour. Le titre de la barre est court et descriptif.

## Composants obligatoires

| Composant | Variantes | Règle |
|---|---|---|
| `SPrimaryButton` | enabled, loading, disabled | une action principale par zone |
| `SSecondaryButton` | outline, tonal | action secondaire non concurrente |
| `STextField` | default, focused, error, disabled | label au-dessus, aide sous le champ |
| `SStatusBadge` | draft, active, closed, success, warning | texte + couleur, jamais couleur seule |
| `SCollectionCard` | image, placeholder, compact | titre et prochaine action toujours visibles |
| `STestCard` | draft, active, closed | réponses et statut au même niveau |
| `SProgressHeader` | step, percentage | affiche le sens de la progression |
| `SUploadTile` | empty, preview, uploading, error | reprise et remplacement explicites |
| `SQuestionRow` | reorderable, selected, disabled | type visible par icône + libellé |
| `SInsightCard` | positive, caution, neutral | insight d’abord, métrique ensuite |
| `SBottomSheet` | confirmation, picker, destructive | poignée, titre, action claire |
| `SInlineNotice` | info, success, warning, error | message humain et action de reprise |
| `SSkeleton` | text, card, chart | même géométrie que le contenu final |

## Boutons et actions

Le bouton primaire terracotta est plein, hauteur 52 dp, texte blanc, rayon 14. Le loading conserve la largeur et remplace le texte par un indicateur ; il devient non cliquable pour éviter le double envoi. La suppression est une action secondaire rouge dans une confirmation, jamais un bouton primaire.

## Formulaires

Un écran de formulaire ne contient qu’une décision principale par section. Les champs obligatoires portent `*` et une aide précise. Les erreurs apparaissent sous le champ sans effacer la saisie. Pour les formulaires longs, utiliser des étapes courtes avec `Continuer` et `Retour`.

## Graphiques mobiles

Analytics : cartes de synthèse en premier, graphique unique par section, légende lisible et valeur affichée dans le contenu. Les graphiques ne doivent pas nécessiter un hover. Toujours montrer `n = nombre de réponses` et un message de prudence sous 30 réponses.

## Accessibilité

Contraste AA sur texte courant, textes d’état accompagnés d’une icône et d’un libellé, support de `textScaleFactor`, ordre de focus logique, label sémantique pour chaque icône et zones tactiles de 48 dp minimum.
