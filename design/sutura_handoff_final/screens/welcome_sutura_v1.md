# Sutura — Welcome onboarding / V1

## Intention

Installer Sutura comme un atelier de création et de décision, puis conduire l’utilisateur vers une seule action : commencer.

## Composition mobile

- Artboard : 390 × 844 dp.
- Fond : `canvas #FCF9F6`.
- Marque en haut à gauche : wordmark Sutura terracotta.
- Action secondaire en haut à droite : `Passer`.
- Visuel principal : carte terracotta de 350 × 346 dp, rayon 28 dp, avec abstraction textile et motif circulaire discret.
- Message : `Donne une forme à tes intuitions.`
- Soutien : `Crée ta collection, écoute ton audience et avance avec des décisions plus sûres.`
- Progression : 01 / 03, trois segments dont le premier est actif.
- CTA principal : `Commencer`, 342 × 52 dp, terracotta, rayon 14 dp.
- Action secondaire : `J’ai déjà un compte`.

## Décisions UX

- Le Welcome ne demande aucune information.
- `Commencer` ouvre le panneau d’introduction suivant, pas directement un formulaire.
- `Passer` mène directement à la connexion.
- Le compte existant reste accessible sans concurrence visuelle avec l’action principale.
- Le CTA reste visible sans scroll sur une largeur de 360 dp ; sous 375 dp, le padding horizontal passe à 16 dp et le visuel peut descendre à 310 dp de hauteur.

## Comportements

- Apparition : logo puis visuel en fondu et translation verticale légère, 260 ms, `easeOutCubic`.
- Tap sur `Commencer` : état pressé 100 ms puis transition horizontale vers Introduction 02.
- Tap sur `Passer` : transition directe vers Connexion.
- Aucun loader réseau sur cet écran.
- Les actions ont une zone tactile minimale de 48 dp.

## Composants Flutter attendus

- `SBrandWordmark`
- `SOnboardingVisual`
- `SProgressHeader`
- `SPrimaryButton`
- `STextButton`

## À valider

1. Le ton du message principal.
2. Le maintien ou non du lien `Passer`.
3. Le choix entre l’abstraction textile et une photo de modèle pour le visuel.
