# Instructions pour agent de codage — Sutura

## Priorité actuelle

Travailler d’abord sur le backend dans `apps/api`.

Ne pas brancher Flutter tant que le backend MVP n’est pas suffisamment complet, testé et stable.

## Contexte produit

Sutura est refondu en produit mobile-first :

- app créateur en Flutter ;
- backend NestJS/PostgreSQL ;
- questionnaire public accessible sans compte ;
- ancien Symfony/Vue conservé comme référence métier/design.

## Règles de travail

- Ne pas supprimer `sutura-backend/` ni `sutura-frontend/`.
- Ne pas committer de secrets ou de `.env`.
- Garder `apps/api/.env.example`.
- Garder les routes publiques de questionnaire sans authentification.
- Garder les routes créateur privées sous JWT.
- Vérifier l’ownership à chaque nouvelle requête privée.
- Préférer des changements ciblés, testés, et documentés.

## Commandes backend

```bash
cd /home/hope/labs/samsiathProjet/Sutura/apps/api
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:reset
npm run start:dev
```

Validation obligatoire avant passation :

```bash
npm run typecheck
npm run build
npm run test
npm audit --audit-level=moderate
npx prisma validate
```

## Compte seed

```text
email: creator@sutura.app
password: password123
```

## Fichiers à lire avant de coder

1. `HANDOFF.md`
2. `apps/api/README.md`
3. `apps/api/BACKLOG.md`
4. `apps/api/API_CONTRACT.md`
5. `apps/api/prisma/schema.prisma`
6. `apps/api/src/services/store.service.ts`

## Définition de terminé

Une tâche backend est terminée seulement si :

- le comportement attendu est couvert par test ou vérifié manuellement ;
- les routes privées nécessitent un token ;
- les données d’un autre créateur restent inaccessibles ;
- le questionnaire public reste utilisable sans compte ;
- la documentation est mise à jour si le contrat API change.
