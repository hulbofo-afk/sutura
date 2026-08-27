# Sutura — Flutter implementation notes

## Architecture de thème

Créer un `ThemeExtension<SuturaTokens>` contenant les couleurs sémantiques, rayons, espacements et élévations. Ne pas disperser les hexadécimaux dans les widgets. Les valeurs de `tokens.json` sont la source de vérité.

Utiliser `ColorScheme` Material 3 pour les rôles système, puis les extensions Sutura pour `clay`, `blush`, `sage`, les surfaces éditoriales et les graphiques.

## Arborescence suggérée

```text
lib/
  core/theme/sutura_theme.dart
  core/widgets/s_button.dart
  core/widgets/s_text_field.dart
  core/widgets/s_status_badge.dart
  core/widgets/s_collection_card.dart
  core/widgets/s_test_card.dart
  core/widgets/s_upload_tile.dart
  core/widgets/s_insight_card.dart
  features/auth/
  features/home/
  features/collections/
  features/tests/
  features/public_response/
  features/analytics/
```

## Règles d’implémentation

- Tous les écrans doivent fonctionner en 360 dp sans débordement.
- Préférer `SafeArea`, `CustomScrollView` et `SliverAppBar` pour les détails longs.
- Les CTA bas d’écran doivent respecter les insets clavier et système.
- Les uploads utilisent une miniature locale avant réponse API ; l’état de transfert est indépendant de `is_active`.
- Les erreurs API sont mappées vers des messages métier centralisés.
- Les états de chargement, vide, erreur et succès sont des variantes explicites du widget, pas des conditions visuelles improvisées dans chaque écran.
- Les graphiques doivent rester lisibles avec accessibilité texte activée ; fournir un résumé textuel.

## Contrat de nommage des assets

`brand_logo_wordmark.png`, `brand_mark_s.png`, `brand_logo_square.png`, `ref_hero_collection.jpg`, `ref_satin_texture.jpg`. Prévoir ensuite des exports SVG/PNG @1x, @2x et @3x si le logo source est vectorisé.

## Definition of done

Un écran est considéré prêt quand : layout 360/390/430 validé, états loading/empty/error/success testés, clavier et rotation raisonnablement gérés, labels sémantiques ajoutés, navigation arrière cohérente et aucun texte de debug visible.
