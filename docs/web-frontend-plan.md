# Sutura — Plan Version Web (historique)

> **Document historique — ne décrit plus l’architecture active.** Depuis le 28 août 2026, le frontend utilise Convex comme backend applicatif. Voir `README.md` et `HANDOFF.md` pour la vision actuelle.
>
> Ce plan conserve le contexte de la première implémentation basée sur `/apps/api` (NestJS 11 + Prisma 7.8 + PostgreSQL) et ne doit pas servir de contrat pour les nouvelles fonctionnalités.
> Objectif: scaffold `apps/web` — version web créateur + page publique testeur, en réutilisant le contrat `API_CONTRACT.md`

## 1. Inventaire backend récupéré (fonctionnel)

**Modules:** `auth` / `collections` / `models` / `fashion-tests` / `public-tests` / `analytics` / `recommendations` / `reports` / `uploads` + `health`
- Auth JWT 15m + refresh, `POST /auth/register|login`, `GET /auth/me`, `POST /auth/forgot|reset-password`
- CRUD Collections paginées, Models (reorder, photo/sketch/video upload via `POST /uploads/sign|confirm`), FashionTests (create/publish/close/slug), Questions 9 types, PublicTests `/public-tests/:slug` GET+POST anonyme, Analytics paginées, Reports PDF, Recommendations provider local
- Validation pure `src/services/validators.ts`, `scores.service.ts`, `ownership.ts` — 67 tests verts
- `infra/.env.production` déjà présent (600) — à ne jamais committer
- `API_CONTRACT.md` stabilisé: wrapper `{data, meta}`, erreurs `{error:{code,message}}`, rate-limit, `X-API-Version`

## 2. Choix stack web

- **Next.js 15 App Router + TypeScript** (aligné avec NestJS TS, permet SSR pour `/s/[slug]` SEO + OG)
- **Tailwind CSS** + palette existante **rose/magenta premium minimaliste** (assets `sutura-frontend/src/assets`, `sutura-frontend/src/style.css` comme référence visuelle)
- **TanStack Query v5** pour cache/listings paginés + **Ky/fetch** wrapper typé
- **Zustand** pour auth store (token + user `brandName/city/country`)
- **react-hook-form + zod (`dto` miroirs `class-validator`)** pour forms
- Uploads: presigned R2 `sign -> PUT -> confirm` (même flow que mobile)

Non retenu: Vue (ancien `sutura-frontend` gelé comme référence uniquement, cf `AGENTS.md`).

## 3. Structure `apps/web` à créer

```
apps/web/
  app/
    (auth)/login/page.tsx        (auth)/register/page.tsx
    (dashboard)/dashboard/page.tsx  (dashboard)/collections/page.tsx  (dashboard)/collections/[id]/page.tsx
    (dashboard)/fashion-tests/page.tsx  (dashboard)/fashion-tests/[id]/page.tsx
    s/[slug]/page.tsx  // publique testeur, ISR + client submit
    analytics/[testId]/page.tsx  reports/[testId]/page.tsx
  components/  ui/  forms/  charts/
  lib/
    api.ts        // ky + JWT + refresh + X-API-Version + paginated helper
    auth.ts       // login/register/me + storage
    uploads.ts    // sign/confirm/delete
    types.ts      // miroir dto backend
  stores/auth.ts
  .env.example  README.md
```

## 4. Flux à câbler (priorité P0)

1. **Auth:** register/login → store token → `Authorization: Bearer` → `GET /auth/me` garde, middleware redirect si 401
2. **Collections:** list `GET /collections?page&search&sort` → create `POST /collections` → detail `PATCH /collections/:id` → archive
3. **Models:** `POST /collections/:id/models` + reorder `POST /reorder` + uploads `sign/confirm` (photo/sketch/video)
4. **FashionTest:** create depuis collection → add questions (9 types) → `publish` (validations métier: model/question/modelId/closesAt/maxResponses) → slug → `close`
5. **Public:** `GET /public-tests/:slug` (anonyme) → `POST /public-tests/:slug/submit` (validation par type)
6. **Analytics:** `GET /analytics/:testId` + `.../responses?page` paginées
7. **Reports/Reco:** `GET /reports/:testId/pdf` + `GET /recommendations/:testId`

## 5. Étapes `oc-loop`

1. Scaffold `apps/web` : `create-next-app --ts --tailwind --app` + deps Query/Zustand/zod
2. Copier assets premium `sutura-frontend/src/assets` → `apps/web/public/brand`
3. Générer `lib/api.ts` depuis `API_CONTRACT.md` + `prisma/schema.prisma` (types)
4. Implémenter auth + layout dashboard
5. Itérer pages créateur → publique → analytics (tests manuels avec `creator@sutura.app / password123`)
6. Vérif: `npm run typecheck && npm run build && npm run lint` dans `apps/web`

## 6. Définition de done web

- `apps/api` inchangé, backend reste la source de vérité
- `apps/web/.env.example` (pas de `.env` commité), `PUBLIC_API_URL=http://localhost:4000/api`
- Toutes routes privées 401 sans token, ownership respectée, publique sans token OK
- `npm run typecheck` + `npm run build` verts

Lancement proposé:
```bash
~/.local/bin/oc-loop -g "Scaffold apps/web Next.js 15 exploitant le backend NestJS récupéré (API_CONTRACT.md) ..." -v "npm run typecheck && npm run build" -d /home/hopeman/labs/sutura -m imole/gpt-5.4 -n 15
```
