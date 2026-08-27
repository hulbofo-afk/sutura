# Catalogue d’implémentation Sutura

## Fondations

- Palette : framboise `#E90046`, jaune `#F5D500`, prune `#4A2630`, rose pâle
  `#FCE8EB`, noir `#101418`, blanc `#FFFFFF`.
- Rayon standard : `14 dp`; rayon de carte : `20 dp`; rayon de modal : `24 dp`.
- Espacements : base `4 dp`, échelle recommandée `8 / 12 / 16 / 20 / 24 / 32`.
- Zone tactile minimale : `48 dp`.
- Icônes : SVG Sutura 24×24, trait 2 px, extrémités arrondies.

## Comportements communs

- `idle`, `loading`, `success`, `error`, `disabled` sont des états explicites.
- Le chargement ne doit pas modifier la hauteur du composant.
- Les erreurs sont affichées sous le champ ou dans le bloc concerné, jamais
  uniquement par la couleur.
- Les composants doivent rester lisibles à 360, 390 et 430 dp.
- Les textes longs sont tronqués proprement ou passent sur deux lignes selon le
  contrat ; aucun overflow horizontal.

## Ordre recommandé

`tokens → logos/icônes → buttons → text fields → cards → badges → navigation →
overlays → forms → feedback → layouts → screens`.

Les fichiers Dart de chaque pack sont volontairement indépendants afin qu’un
agent puisse les intégrer progressivement ou les réunir dans un barrel file.
