# Sutura — ordre de livraison à l'agent de codage

## Phase 1 — fondations

- Charger `brand/tokens.json`.
- Créer les couleurs sémantiques, espacements, rayons et typographies.
- Déclarer les assets de `brand/logos/` et `brand/icons/`.
- Préserver les ratios et utiliser `BoxFit.contain` pour les logos.

## Phase 2 — composants

- Boutons : `components/buttons/lib/sutura_buttons.dart`.
- Champs : `components/text_fields/lib/sutura_text_fields.dart`.
- Cartes : `components/cards/lib/sutura_cards.dart`.
- Badges et chips : `components/badges/lib/sutura_badges.dart`.
- Navigation : `components/navigation/lib/sutura_navigation.dart`.
- Modales et bottom sheets : `components/overlays/lib/sutura_overlays.dart`.
- Formulaires : `components/forms/lib/sutura_forms.dart`.
- Feedback : `components/feedback/lib/sutura_feedback.dart`.
- Layout : `components/layout/lib/sutura_layout.dart`.
- Icônes : `brand/icons/icons/` pour la base et `brand/icons/variants/` pour les couleurs explicites.
- Ajouter une zone tactile minimale de 48 dp.
- Rendre les états explicites : idle, loading, success, disabled.

## Phase 3 — écrans prioritaires

- Welcome/onboarding : `screens/references/onboarding-introduction.png`.
- Connexion : `screens/references/auth-login.png`.
- Accueil privé et création : reprendre les contrats de `docs/SCREEN_SPECS_BASE.md`.
- Chaque écran doit composer les packs de `components/` et ne pas créer de style local.

## Phase 4 — validation

- Tester 360, 390 et 430 dp.
- Vérifier les états réseau et les erreurs métier.
- Vérifier les labels sémantiques et la navigation retour.
- Comparer les écrans avec `screens/references/` sans réintroduire l'ancienne palette.
