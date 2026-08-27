# Sutura — Flows & états

## Flow 1 — Premier lien partageable

`Connexion → Accueil → Créer une collection → Ajouter un modèle → Créer un test → Ajouter une question → Aperçu → Publier → Partager`

Après la connexion, l’accueil affiche une seule prochaine action. Chaque étape sauvegarde localement le brouillon si possible. Après publication, l’écran doit montrer le badge `Actif`, l’URL complète, `Copier`, `QR code` et `Partager`.

## Flow 2 — Répondant public

`Lien/QR → Intro du test → Questions → Vérification → Envoi → Confirmation`

Aucun compte, aucune navigation privée et aucune interruption marketing pendant la réponse. Une erreur réseau conserve les réponses dans le formulaire et propose `Réessayer`.

## Flow 3 — Retour créateur

`Accueil → Test actif → Analytics → Question → Recommandation → Action proposée`

Une métrique décrit ; une recommandation explique quoi faire. Exemple : « 68 % aiment la coupe » puis « Conserver la coupe et tester un prix inférieur ».

## Matrice d’état commune

| État | Comportement attendu |
|---|---|
| Chargement initial | skeleton de même forme que le contenu, pas d’écran blanc |
| Rafraîchissement | contenu conservé, indicateur discret en haut |
| Vide | explication chaleureuse + CTA unique |
| Erreur réseau | message humain, bouton réessayer, brouillon conservé |
| Validation | erreur sous le champ, focus sur le premier problème |
| Succès | confirmation locale + prochaine action visible |
| Session expirée | bottom sheet explicatif, retour à la connexion après confirmation |
| Upload interrompu | miniature conservée, reprise/remplacement proposé |
| Hors ligne | bannière persistante, actions locales permises si sûres |

## États sensibles

- Publication : afficher une confirmation si le test n’a aucune question ou si l’audience est vide.
- Archivage : expliquer que le lien public ne sera plus actif.
- Suppression : demander le nom de l’objet ou utiliser une confirmation explicite pour les contenus importants.
- Faible échantillon : sous 30 réponses, afficher `Lecture indicative — échantillon encore limité`.
