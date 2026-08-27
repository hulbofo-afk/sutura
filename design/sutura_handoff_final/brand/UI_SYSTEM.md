# Sutura — UI system final

## Tokens

Les valeurs de `tokens.json` sont la source de vérité. Les composants ne doivent pas introduire de couleurs arbitraires.

- Espacements : `4, 8, 12, 16, 20, 24, 32, 40 dp`.
- Rayons : `10, 14, 20 dp`, et `999` pour les pills.
- Zone tactile minimale : `48 dp`.
- CTA principal : hauteur `52 dp`, rayon `14 dp`.

## Composants prioritaires

1. `SuturaButton`
2. champs de formulaire
3. cartes de collection et de test
4. badges et statuts
5. navigation basse
6. modales et bottom sheets

## Règles d'écran

- Fonctionner à 360, 390 et 430 dp sans débordement.
- Utiliser `SafeArea` et respecter les insets clavier.
- Définir explicitement les états loading, empty, error et success.
- Ne pas utiliser une illustration décorative pour remplacer une information fonctionnelle.
- Les icônes proviennent de `brand/icons/` et respectent la grille 24×24, trait 2 px et extrémités arrondies.
