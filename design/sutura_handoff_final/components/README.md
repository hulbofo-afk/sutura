# Sutura — composant library

Ce dossier regroupe les composants réutilisables du produit. L’agent Flutter
doit commencer par les tokens, puis intégrer les composants avant de construire
les écrans.

## Packs inclus

| Pack | Contrat | Implémentation |
|---|---|---|
| Buttons | `SuturaButton` | `buttons/lib/sutura_buttons.dart` |
| Text fields | `STextField`, `SSearchField` | `text_fields/lib/sutura_text_fields.dart` |
| Cards | `SCard`, `SMetricCard`, `SListTileCard` | `cards/lib/sutura_cards.dart` |
| Badges | `SBadge`, `SStatusBadge`, `SChip` | `badges/lib/sutura_badges.dart` |
| Navigation | `SBottomNavigation`, `SAppBar` | `navigation/lib/sutura_navigation.dart` |
| Overlays | `SModal`, `SBottomSheet`, `SConfirmDialog` | `overlays/lib/sutura_overlays.dart` |
| Forms | `SFormSection`, `SFormRow`, `SSelectField` | `forms/lib/sutura_forms.dart` |
| Feedback | `SEmptyState`, `SErrorState`, `SLoadingState`, `SToast` | `feedback/lib/sutura_feedback.dart` |
| Layout | `SPageScaffold`, `SSectionHeader`, `SResponsiveContent` | `layout/lib/sutura_layout.dart` |

## Règle d’intégration

Les composants sont des blocs de base. Les écrans ne doivent pas recréer leurs
propres boutons, champs, rayons ou couleurs. Toute nouvelle variante doit être
ajoutée au contrat du pack et documentée avant utilisation.

Toutes les cibles interactives font au minimum `48 dp`. La palette source de
vérité est `brand/tokens.json`.
