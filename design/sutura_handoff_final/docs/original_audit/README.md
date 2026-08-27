# Sutura — Mobile UI/UX handoff

Dossier de référence pour concevoir l’application mobile créateur Sutura.

## Objectif produit

Sutura aide les créateurs de mode à tester leurs collections auprès de leur audience avant production : créer une collection, présenter des modèles, composer un questionnaire, le partager, puis lire les résultats.

L’application est mobile-first, premium mais simple, avec une sensation d’atelier éditorial. Le produit doit donner confiance au créateur sans ressembler à un back-office froid.

## À utiliser dans ce dossier

- `assets/logo-sutura.png` : logo horizontal existant.
- `assets/logo-S.PNG` : symbole S existant en haute résolution.
- `assets/logo-sutura-square.png` : variante carrée.
- `references/` : images de référence issues de l’ancien produit.
- `VISUAL_DIRECTION.md` : direction artistique et tokens.
- `SCREENS.md` : inventaire des écrans à concevoir.
- `FLOWS.md` : parcours et états importants.
- `DESIGNER_CHECKLIST.md` : livrables attendus du designer.

## Priorité de conception

1. Connexion et première arrivée.
2. Accueil créateur.
3. Collections et détail d’une collection.
4. Création d’un modèle avec photo.
5. Tests et détail d’un test.
6. Création de questions et publication.
7. Partage du questionnaire.
8. Réponse publique et confirmation.
9. Analytics et recommandations.

Le dossier décrit le périmètre cible. La version Flutter actuelle est un socle fonctionnel ; elle ne doit pas être considérée comme la référence visuelle finale.

## Contraintes produit

- Les routes créateur sont privées et nécessitent une session.
- Le questionnaire public est accessible sans compte.
- L’API de production est `https://api.suturamode.com/api`.
- Le mobile doit gérer les états chargement, erreur réseau, vide, succès et session expirée.
- Prévoir Android en premier, puis iOS.
