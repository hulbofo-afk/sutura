# Sutura — Handoff final Flutter

Ce dossier rassemble les éléments développés et validés pour la refonte Sutura. Il constitue la source de référence visuelle et d'intégration pour l'agent de codage Flutter.

## Direction finale

- Framboise : `#E90046`
- Jaune : `#F5D500`
- Prune : `#4A2630`
- Rose pâle : `#FCE8EB`
- Noir : `#101418`
- Blanc : `#FFFFFF`

Le logo conserve le wordmark Sutura et le symbole `S`. Aucune mutation en forme de G, aucun gradient, aucune ombre décorative et aucune déformation ne sont autorisés.

## Contenu

| Dossier | Contenu |
|---|---|
| `brand/logos/` | Wordmarks, symboles S, icônes d'application, favicons et manifeste |
| `brand/icons/` | 18 icônes SVG, base `currentColor` et 90 variantes couleur |
| `components/buttons/` | Pack Flutter des boutons, API, tokens, états et critères d'acceptation |
| `components/` | Packs Flutter des champs, cartes, badges, navigation, overlays, formulaires, feedback et layout |
| `screens/references/` | Planches et écrans déjà produits, utilisés comme références visuelles |
| `screens/screen_refs/` | 22 références écran autonomes, avec SVG, PNG et manifeste |
| `docs/` | Spécifications écran, flux, états et notes d'implémentation |
| `brand/` | Tokens, règles de marque et assets de matière existants |

## Ordre d'implémentation recommandé

1. Copier les tokens et créer `ThemeExtension<SuturaTokens>`.
2. Ajouter les logos et les SVG dans les assets Flutter.
3. Intégrer les packs de `components/README.md` dans l'ordre indiqué.
4. Implémenter l’onboarding et l’authentification en utilisant `docs/SCREEN_REFERENCE_PACK.md` et `screens/screen_refs/`.
5. Vérifier les états loading, empty, error, success et les largeurs 360/390/430 dp.

## Règle importante

Les planches sont des références d'identité. Les fichiers Markdown, JSON, SVG et Dart sont les contrats d'implémentation.

## Point d'intégration boutons

Le bouton de succès utilise désormais `assets/icons/check.svg`. Le projet Flutter devra avoir `flutter_svg` dans ses dépendances et déclarer le dossier d'assets dans `pubspec.yaml`.
