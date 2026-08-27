# Sutura — Screen specs

## 01. Connexion

Fond `canvas`, logo wordmark centré dans la zone supérieure, titre « Ton atelier commence ici. », sous-texte court, champs email/mot de passe, lien mot de passe oublié, bouton primaire. Clavier : le formulaire défile pour garder le champ et le CTA visibles. Erreur : message sous le champ ou notice au-dessus du CTA.

## 02. Accueil créateur

Barre supérieure : symbole S, salutation et avatar. Hero terracotta doux : « Fais avancer ta prochaine collection » + prochaine action. Ensuite trois métriques compactes : collections, tests actifs, réponses. Section « Tes collections » avec deux cartes maximum et lien `Voir tout`. Empty state : une action « Créer ma première collection ».

## 03. Collections

Barre de titre, recherche optionnelle, filtre de statut. Cartes verticales ou grille 2 colonnes selon largeur ; image dominante, nom, saison, nombre de modèles, badge. CTA flottant `+` avec label accessible `Créer une collection`.

## 04. Détail collection

Hero image 16:10, titre superposé dans une zone lisible, statut et date. Résumé court, galerie horizontale des modèles, tests associés, actions `Ajouter un modèle` et `Partager`. Menu secondaire : modifier, archiver.

## 05. Ajouter un modèle

Stepper léger `Modèle 1/2` uniquement si nécessaire. Zone upload haute de 220–260 dp avec aperçu et bouton appareil photo/galerie. Champs nom, description, couleurs, prix souhaité. CTA fixe en bas uniquement quand le clavier est fermé. Upload affiche progression et reprise.

## 06. Liste des tests

Header avec filtre `Tous / Brouillons / Actifs / Fermés`. Chaque carte montre titre, collection, badge, réponses et dernière activité. Empty state lié à une collection si l’écran est ouvert depuis son détail.

## 07. Éditeur de test

Header titre + aperçu. Bandeau de statut draft/active. Liste de questions réordonnable, chaque ligne affiche numéro, type et extrait. CTA `Ajouter une question`. Avant publication, checklist : titre, collection, au moins une question, audience.

## 08. Publication et partage

Écran de succès avec symbole S, badge `Test actif`, URL dans un champ copiable, QR code, boutons `Copier le lien` et `Partager`. Ne jamais afficher l’URL comme si elle était active avant la réussite API.

## 09. Réponse publique

Fond clair, wordmark discret, nom de la maison et collection. Progression numérique et ligne. Une question par écran pour les tests courts ; groupes de 2–3 pour les tests longs. Contrôles adaptés au type : choix, échelle, prix, texte. Bouton `Suivant` toujours au même endroit.

## 10. Analytics

Header avec nom du test et période. Première carte : réponses, complétion, score de désirabilité. Deuxième zone : insight principal en langage naturel. Puis détail par question et segments. Chaque donnée doit afficher son contexte d’échantillon.

## 11. Recommandations

Liste priorisée de cartes : `Décision`, `Pourquoi`, `Action suggérée`. Utiliser une hiérarchie forte plutôt qu’un mur de graphiques. Les recommandations doivent pouvoir être ignorées ou marquées comme traitées.

## 12. Profil

Carte identité, marque, pays, préférences et sécurité. Les actions sensibles sont en bas, séparées visuellement. Déconnexion avec confirmation courte.
