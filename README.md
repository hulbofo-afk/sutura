# Sutura — Backend + Design Handoff

Backend NestJS/PostgreSQL (MVP) + specs frontend + design system pour Sutura — produit mobile-first (app créateur Flutter).

Ce repo public expose **uniquement** :
- **Backend** `apps/api` (NestJS 11 + Prisma 7 + PostgreSQL)
- **Specs frontend** `docs/web-frontend-plan.md` + `apps/api/API_CONTRACT.md`
- **Design handoff** `design/sutura_handoff_final` (tokens, logos, screens, composants)
- **Infra** `infra/` (Docker + Caddy + backup, sans secrets)

Le code du frontend actuel (`apps/web`) n'est **pas** publié ici (volontaire).

## Démarrage backend

```bash
cd apps/api
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:reset
npm run start:dev
```

API : `http://localhost:4000/api`

Compte seed :

```text
email: creator@sutura.app
password: password123
```

Obtenir un token :

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"creator@sutura.app","password":"password123"}'
```

## Routes MVP

Auth : `POST /auth/register`, `POST /auth/login`, `GET /auth/me`

Collections : `GET/POST /collections`, `GET/PATCH /collections/:id`, `POST /collections/:id/archive`

Models : `POST/PATCH/DELETE /collections/:collectionId/models`, `POST /collections/:collectionId/models/reorder`

Fashion Tests : `GET /fashion-tests`, `POST /collections/:collectionId/fashion-tests`, `GET/PATCH /fashion-tests/:testId`, `POST /fashion-tests/:testId/publish|close`

Questions : `POST/PATCH/DELETE /fashion-tests/:testId/questions`, `POST /fashion-tests/:testId/questions/reorder`

Public (sans auth) : `GET /public-tests/:slug`, `POST /public-tests/:slug/responses`

Analytics / Reco / Reports (JWT) : `GET /analytics/:testId`, `GET /ai-recommendations/:testId`, `GET /reports/fashion-tests/:testId.pdf`

Uploads : `POST /uploads/sign`, `POST /uploads/confirm`, `DELETE /uploads`

Health : `GET /health`, `GET /health/ready`, `GET /health/extended` (JWT)

## Contrat API

Voir `apps/api/API_CONTRACT.md` et `docs/web-frontend-plan.md` pour le contrat stable frontend/backend.

## Design

- `design/sutura_handoff_final/brand/` — tokens, logos, UI system
- `design/sutura_handoff_final/screens/screen_refs/` — 22 écrans ref (SVG/PNG)
- `design/sutura_handoff_final/docs/` — direction visuelle, flows, specs
- `design/sutura_handoff_final/components/` — Flutter component packs

Palette : rose/magenta premium minimaliste — voir `design/sutura_handoff_final/brand/tokens.json`

## Validation

```bash
npm run typecheck
npm run build
npm run test
npm audit --audit-level=moderate
npx prisma validate
```

## Infra

Voir `infra/README.md` + `infra/.env.production.example` pour le deploy VPS/R2.

Ne jamais committer `.env`.

## Documentation complète

- `HANDOFF.md` — dossier de passation
- `BACKLOG.md` — backlog backend
- `AGENTS.md` — règles de travail
