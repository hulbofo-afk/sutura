# Sutura — Pack de références écran

> Source visuelle principale : `screens/screen-reference-pack-preview.png`.
> Cette planche remplace l’ancienne grille d’inventaire comme référence de composition.

Ce pack contient les références autonomes utilisées pour implémenter l’application Flutter à partir d’une base visuelle commune.

## Règles communes

- Viewport de référence : `390 × 844 dp`.
- Tester également les largeurs `360`, `430` et les textes longs.
- Palette obligatoire : framboise `#E90046`, jaune `#F5D500`, prune `#4A2630`, rose pâle `#FCE8EB`, noir `#101418`, blanc `#FFFFFF`.
- Les SVG de ce dossier sont des références visuelles déterministes. Les composants Dart existants restent le contrat d’implémentation.
- Ne pas inventer de gradient, d’ombre décorative, de nouvelle couleur ou de mutation du logo.

## Nouvelle direction de composition — obligatoire

Les écrans ne doivent plus être composés comme des tableaux de cartes uniformes. Ils doivent reprendre le langage de la planche de référence :

- fond blanc ou ivoire très clair, avec le rose pâle réservé aux surfaces secondaires ;
- un visuel héro ou une matière textile forte lorsqu’un écran possède une zone de découverte ;
- titres éditoriaux plus expressifs, avec une serif élégante pour les moments de marque ;
- interface fonctionnelle en sans-serif lisible, avec peu de niveaux de texte ;
- une seule action primaire clairement dominante par écran ;
- cartes plus grandes, moins nombreuses et mieux hiérarchisées ;
- navigation basse légère, toujours alignée et jamais traitée comme une simple ligne de texte ;
- framboise utilisée pour guider l’œil, jaune utilisé comme accent ponctuel, prune utilisé pour les surfaces de contraste ;
- aucune composition ne doit donner l’impression d’un dashboard générique ou d’une planche de composants miniature.

Les quatre écrans de la planche principale servent de références de densité et de rythme : onboarding, accueil créateur, création de test et résultats. Les 22 écrans fonctionnels doivent dériver de ce même canevas.

## Parcours d’onboarding

| Écran | Fichier | Action principale | Suite |
|---|---|---|---|
| 01 | `01-onboarding-welcome.svg` | Comprendre la promesse | Continuer |
| 02 | `02-onboarding-value.svg` | Comprendre le bénéfice | Continuer |
| 03 | `03-onboarding-brand.svg` | Présenter son univers | Continuer |
| 04 | `04-onboarding-first-collection.svg` | Créer une collection | Continuer |
| 05 | `05-onboarding-first-test.svg` | Préparer le premier test | Continuer |

L’onboarding doit être skippable, reprendre à la dernière étape connue et ne pas perdre les données saisies. Après l’étape 05, l’utilisateur arrive sur l’accueil créateur avec une seule prochaine action clairement visible.

## Authentification et création

- `06-auth-login.svg` : connexion et récupération de mot de passe.
- `07-create-account.svg` : création d’un espace sans formulaire excessif.
- `08-creator-home.svg` : accueil créateur après connexion.
- `09-create-collection.svg` : création d’une collection.
- `10-add-model.svg` : ajout d’un modèle avec upload et prix.

## Création et publication d’un test

- `11-test-list.svg` : brouillons, tests actifs et filtres.
- `12-test-editor.svg` : éditeur et réorganisation des questions.
- `13-question-editor.svg` : configuration d’une question.
- `14-test-preview.svg` : aperçu public avant publication.
- `15-publish-success.svg` : confirmation d’activation, URL, QR code et partage.

## Retour créateur

- `16-collection-detail.svg` : détail d’une collection.
- `17-analytics.svg` : métriques contextualisées et insight principal.
- `18-recommendations.svg` : décisions et actions recommandées.
- `19-profile.svg` : profil, préférences et zone sensible.

## Parcours répondant public

- `20-public-intro.svg` : introduction sans compte.
- `21-public-question.svg` : question avec progression.
- `22-public-confirmation.svg` : confirmation après envoi.

## États à produire pour chaque écran

Chaque écran final doit aussi posséder les états `loading`, `empty`, `error`, `success`, `offline` lorsque son flux les justifie. Une erreur réseau conserve les réponses ou le brouillon et propose une action humaine `Réessayer`.

## Ordre d’implémentation recommandé

1. Onboarding et authentification.
2. Accueil et création de collection.
3. Ajout de modèle.
4. Liste, éditeur, question et aperçu du test.
5. Publication et partage.
6. Parcours répondant public.
7. Analytics, recommandations et profil.
8. États transversaux et responsive.
