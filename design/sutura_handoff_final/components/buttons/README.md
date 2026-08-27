# Sutura — Pack 01 · Buttons

Pack de composants Flutter prêt à intégrer dans le handoff final Sutura.

## Contenu

- `lib/sutura_buttons.dart` — composants Flutter ;
- `assets/icons/check.svg` — icône SVG utilisée par l'état succès ;
- `pubspec-assets.yaml` — extrait de dépendance et déclaration d'assets ;
- `docs/specification.md` — règles visuelles et comportementales ;
- `docs/api.md` — contrat d’utilisation pour l’agent de codage ;
- `docs/acceptance.md` — critères de validation ;
- `tokens.json` — valeurs utilisables comme source de tokens.

## Composants

- `SuturaButton` : composant principal avec variantes, tailles, icône et états ;
- `SPrimaryButton` : raccourci CTA principal framboise ;
- `SSecondaryButton` : raccourci secondaire rose pâle/prune ;
- `SOutlineButton` : action secondaire avec contour ;
- `STextButton` : action discrète ;
- `SIconButton` : action compacte avec zone tactile accessible.

## Règle d’intégration

L’agent doit commencer par copier `lib/sutura_buttons.dart`, puis remplacer les
couleurs et textes codés en dur du projet par les tokens de `tokens.json`.
Les icônes passées au composant doivent provenir du système SVG Sutura.
L'état `success` utilise `flutter_svg` et `assets/icons/check.svg`.

## Contraintes verrouillées

- CTA principal : largeur disponible, hauteur `52 dp`, rayon `14 dp` ;
- largeur cible mobile : `342 dp` sur un écran de `390 dp` ;
- zone tactile minimale : `48 dp` ;
- retour visuel pressé : `100 ms` ;
- aucun gradient, ombre lourde ou effet 3D ;
- adaptation obligatoire sous `375 dp`.
