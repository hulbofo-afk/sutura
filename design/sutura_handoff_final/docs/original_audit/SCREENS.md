# Écrans à concevoir

## A. Accès et onboarding

### A1 — Splash / lancement

Logo Sutura centré, fond blush, animation très courte. Aucun écran de chargement prolongé.

### A2 — Connexion

Logo, promesse courte, email, mot de passe, CTA principal, récupération du mot de passe et état d’erreur. Prévoir clavier mobile et bouton de visibilité du mot de passe.

### A3 — Première arrivée

Présentation en 2 ou 3 panneaux : créer, écouter, décider. CTA « Commencer ». Option de passer l’introduction.

## B. Espace créateur

### B1 — Accueil / dashboard

Header avec identité du créateur, résumé des collections, tests actifs, réponses récentes et prochaine action recommandée. Le dashboard doit être utile en moins de 5 secondes.

### B2 — Collections

Liste en cartes : titre, saison ou statut, nombre de modèles, progression. État vide avec CTA « Créer une collection ». Recherche ou filtre si la liste devient longue.

### B3 — Nouvelle collection

Titre, description, saison, catégorie, audience cible, date de lancement. Afficher une progression si le formulaire est multi-étapes.

### B4 — Détail collection

Hero de collection, galerie des modèles, tests liés, statut et CTA d’ajout. Prévoir actions modifier, archiver et partager.

### B5 — Ajouter / modifier un modèle

Photo principale, photos secondaires, nom, description, couleurs, prix souhaité. Upload depuis galerie, aperçu avant envoi, progression et reprise après erreur.

## C. Tests de marché

### C1 — Liste des tests

Cartes avec titre, collection, statut draft/active/closed, slug et réponses. CTA de création.

### C2 — Créer un test

Choix de la collection, titre, description, audience et aperçu du lien public.

### C3 — Éditeur de test

Liste réordonnable des questions, aperçu, ajout de question, modification, suppression et état de publication.

### C4 — Ajouter une question

Types prioritaires : choix unique, choix multiple, échelle, note, oui/non, prix, texte court, paragraphe et classement. Le design doit rendre le type compréhensible avant le contenu.

### C5 — Publication et partage

Confirmation, URL publique, QR code, copie du lien et partage natif. État publié très clair ; ne pas laisser croire qu’un brouillon est accessible.

## D. Expérience publique

### D1 — Ouverture par lien / slug

Écran sans connexion, identité de la collection, modèle présenté, progression et questions.

### D2 — Questions

Une question par étape ou groupes courts selon la longueur. Progression visible, validation inline, possibilité de revenir en arrière sans perdre la réponse.

### D3 — Confirmation

Remerciement de marque, confirmation d’envoi et éventuellement appel à suivre la maison. Aucun compte obligatoire.

## E. Lecture de valeur

### E1 — Analytics d’un test

Réponses, taux de complétion, score de désirabilité, risque d’invendu, détail par question et segments démographiques. Privilégier des cartes lisibles et des insights actionnables.

### E2 — Recommandations

Synthèse courte, priorités, signaux faibles et actions proposées. Toujours afficher le contexte d’échantillon lorsque le nombre de réponses est faible.

### E3 — Profil et réglages

Identité du créateur, marque, pays, préférences, changement de mot de passe, déconnexion.

## États obligatoires pour chaque écran

- chargement initial et rafraîchissement ;
- vide utile avec une action claire ;
- erreur réseau avec reprise ;
- erreur de validation de formulaire ;
- succès confirmé ;
- session expirée ;
- contenu long et petits écrans Android ;
- mode hors ligne ou perte réseau pendant un upload.
