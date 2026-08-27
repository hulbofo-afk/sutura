# Sutura — dossier de passation agent de codage

Date de passation : 2026-07-24  
Branche locale actuelle : `codex/sutura-mobile-beta`  
Objectif produit : refonte mobile-first de Sutura pour une beta marché.

## Résumé court

Le repo contient encore l’ancien produit Symfony/Vue comme référence métier et design :

- `sutura-backend/` : ancien backend Symfony, à conserver pour référence.
- `sutura-frontend/` : ancien frontend Vue, à conserver pour référence visuelle et fonctionnelle.

La nouvelle base a été créée dans :

- `apps/api/` : nouveau backend NestJS + Prisma + PostgreSQL.
- `apps/mobile/` : base Flutter mobile créateur, non prioritaire pour le prochain cycle.

La priorité demandée par le porteur du projet est claire : finir d’abord le backend, complet et fonctionnel, avant de connecter l’app mobile.

## Décisions verrouillées

- Produit beta mobile-first.
- App créateur en Flutter.
- Backend en Node/NestJS.
- Base de données PostgreSQL.
- Public test sans compte testeur, accessible par lien/QR/réseaux.
- Paiement, gamification, rewards et benchmarks hors MVP immédiat.
- Ancien Symfony/Vue gelé comme référence : ne pas supprimer au démarrage.
- Design direction : rose/magenta premium minimaliste, assets repris depuis `sutura-frontend/src/assets`.

## Backend actuel

Chemin : `apps/api`

Stack :

- NestJS 11
- Prisma 7.8
- PostgreSQL local via Docker
- JWT auth
- bcrypt password hashing
- Vitest + Supertest
- PDFKit pour export PDF

Base locale :

```bash
cd /home/hope/labs/samsiathProjet/Sutura/apps/api
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:reset
npm run start:dev
```

URL API :

```text
http://localhost:4000/api
```

Les tests forcent automatiquement `NODE_ENV=test`. Les tests e2e nécessitent néanmoins PostgreSQL sur le port `55432`.

Compte seed démo :

```text
email: creator@sutura.app
password: password123
```

Les routes créateur privées exigent :

```http
Authorization: Bearer <token>
```

Récupérer un token :

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"creator@sutura.app","password":"password123"}'
```

## Fonctionnalités backend déjà présentes

Auth :

- Inscription créateur.
- Connexion créateur.
- `GET /auth/me`.
- Hash mot de passe avec bcrypt.
- Token JWT.

Sécurité métier :

- Routes créateur protégées par JWT.
- Ownership appliqué au niveau service : un créateur ne doit accéder qu’à ses collections, modèles, tests, questions, analytics, recommandations et rapports.
- Routes publiques de test non protégées volontairement.

Collections :

- Liste.
- Création.
- Détail.
- Modification.
- Archivage.

Modèles :

- Création.
- Modification.
- Suppression.
- Réordonnancement.
- Champs MVP : nom, description, photos, croquis, vidéo, couleurs, prix souhaité, ordre.

Fashion tests :

- Liste.
- Création depuis collection.
- Détail.
- Modification.
- Publication.
- Fermeture.
- Slug public unique.

Questions :

- Création.
- Modification.
- Suppression.
- Réordonnancement.
- Types MVP pris en charge :
  - `single_choice`
  - `multiple_choice`
  - `scale`
  - `rating`
  - `yes_no`
  - `price`
  - `short_text`
  - `paragraph`
  - `ranking`

Public test :

- Consultation publique par slug.
- Soumission de réponse sans compte.
- Validation des questions obligatoires.
- États limite/date de fermeture partiellement couverts via settings.

Analytics :

- KPIs.
- Score de désirabilité `/100`.
- Score de risque d’invendu `/100`.
- Breakdown par question.
- Stats démographiques.
- Conversion/abandon.
- Share events.

Recommandations :

- Recommandations actionnables calculées à partir des réponses collectées.
- Provider local par défaut ; provider Imole optionnel via `IMOLE_API_KEY`, `IMOLE_BASE_URL` et `IMOLE_MODEL`, avec fallback local en cas d’échec.

Rapports :

- Export PDF analytics basique.

## Validations connues

Dernière validation réussie :

```bash
cd /home/hope/labs/samsiathProjet/Sutura/apps/api
DATABASE_URL=postgresql://sutura:sutura@localhost:55432/sutura npm run typecheck
DATABASE_URL=postgresql://sutura:sutura@localhost:55432/sutura npm run build
DATABASE_URL=postgresql://sutura:sutura@localhost:55432/sutura npm run test
DATABASE_URL=postgresql://sutura:sutura@localhost:55432/sutura npx prisma validate
npm audit --audit-level=moderate
```

Résultat observé :

- Typecheck OK.
- Build OK.
- Tests OK : 62 tests (unitaires + e2e avec PostgreSQL local).
- Prisma schema OK.
- Audit npm OK : 0 vulnérabilité modérée ou plus.

## Points sensibles

- Ne pas committer de `.env`.
- `apps/api/.env.example` est volontairement commit-able.
- Le Postgres local écoute sur `55432`, pas `5432`, pour éviter les conflits.
- Vérifier avec `git status --short` avant chaque commit, notamment pour les nouveaux fichiers backend.
- Les fichiers d’upload ajoutés dans `apps/api/src/uploads/` sont actuellement présents dans le workspace mais non suivis par Git.
- Le backend ancien `sutura-backend/` contient probablement de la logique utile, mais ne doit pas être fusionné mécaniquement dans le nouveau backend.
- Le public test doit rester accessible sans compte.
- Les analytics/rapports/recommandations sont privés créateur.

## Prochaine mission recommandée pour l’agent

Continuer dans `apps/api` et livrer un backend MVP durci, avant toute connexion Flutter.

Ordre conseillé :

1. Finaliser les validations métier et les DTO.
2. Ajouter upload médias local/S3-compatible pour photos, croquis, vidéos.
3. Ajouter pagination/filtres sur collections, tests, réponses.
4. Renforcer analytics et export PDF.
5. Ajouter service de recommandations IA branchable, avec fallback local.
6. Préparer contrat API pour mobile.
7. Ajouter tests e2e complets scénario créateur.

Voir aussi : `apps/api/BACKLOG.md`.

## Commandes utiles

Backend :

```bash
cd /home/hope/labs/samsiathProjet/Sutura/apps/api
docker compose up -d postgres
npm run db:reset
npm run start:dev
```

Validation :

```bash
npm run typecheck
npm run build
npm run test
npm audit --audit-level=moderate
npx prisma validate
```

Flutter, si nécessaire plus tard :

```bash
cd /home/hope/labs/samsiathProjet/Sutura/apps/mobile
flutter run
```

## Définition de “done” pour le prochain cycle backend

Un cycle backend est considéré prêt pour branchement mobile si :

- toutes les routes privées fonctionnent avec JWT ;
- le public test fonctionne sans compte ;
- les uploads modèles sont utilisables ;
- les analytics et recommandations retournent des données stables ;
- les tests couvrent le scénario complet :
  créer collection → ajouter modèles → créer test → ajouter questions → publier → répondre publiquement → consulter analytics → générer rapport/recommandation ;
- `npm run typecheck`, `npm run build`, `npm run test`, `npx prisma validate` passent.
