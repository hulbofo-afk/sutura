# Sutura API

NestJS backend for the Sutura mobile beta.

La beta actuelle est gratuite : aucun paiement, abonnement ou checkout n’est exposé par cette API. La monétisation sera traitée dans une version ultérieure, après validation de l’adoption et de la fidélisation.

The API implements the MVP backend contract with NestJS, Prisma 7, and PostgreSQL. The seed data keeps a useful local demo available while the mobile app is not connected yet.

## Run locally

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:reset
npm run start:dev
```

API base URL:

```text
http://localhost:4000/api
```

Runtime checks:

- `GET /api/health` — liveness and served build reference.
- `GET /api/health/ready` — public readiness check; returns `503` when PostgreSQL is unavailable or the required baseline and current-MVP migrations are not both applied.
- `GET /api/health/extended` — authenticated deep health check.

The API trusts one reverse-proxy hop (Caddy) so rate limiting uses the real
client IP while ignoring additional untrusted forwarded hops.

Seeded creator account:

```text
email: creator@sutura.app
password: password123
```

Private creator routes require:

```http
Authorization: Bearer <token>
```

Get a token with:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"creator@sutura.app","password":"password123"}'
```

## MVP Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` `Bearer required`

Creator collections:

- `GET /api/collections` `Bearer required`
- `POST /api/collections` `Bearer required`
- `GET /api/collections/:id` `Bearer required`
- `PATCH /api/collections/:id` `Bearer required`
- `POST /api/collections/:id/archive` `Bearer required`

Collection models:

- `POST /api/collections/:collectionId/models` `Bearer required`
- `PATCH /api/collections/:collectionId/models/:modelId` `Bearer required`
- `DELETE /api/collections/:collectionId/models/:modelId` `Bearer required`
- `POST /api/collections/:collectionId/models/reorder` `Bearer required`

Fashion Tests:

- `GET /api/fashion-tests` `Bearer required`
- `POST /api/collections/:collectionId/fashion-tests` `Bearer required`
- `GET /api/fashion-tests/:testId` `Bearer required`
- `PATCH /api/fashion-tests/:testId` `Bearer required`
- `POST /api/fashion-tests/:testId/publish` `Bearer required`
- `POST /api/fashion-tests/:testId/close` `Bearer required`

Questions:

- `POST /api/fashion-tests/:testId/questions` `Bearer required`
- `PATCH /api/fashion-tests/:testId/questions/:questionId` `Bearer required`
- `DELETE /api/fashion-tests/:testId/questions/:questionId` `Bearer required`
- `POST /api/fashion-tests/:testId/questions/reorder` `Bearer required`

Sharing and public test flow:

- `GET /api/fashion-tests/:testId/share` `Bearer required`
- `POST /api/fashion-tests/:testId/share-events` `Bearer required`
- `GET /api/public-tests/:slug` public, no account required
- `POST /api/public-tests/:slug/responses` public, no account required

Decision support:

- `GET /api/analytics/:testId` `Bearer required`
- `GET /api/analytics/:testId/responses?page=&limit=&sort=createdAt:asc|desc` `Bearer required`
- `GET /api/ai-recommendations/:testId` `Bearer required`
- `GET /api/reports/fashion-tests/:testId.pdf` `Bearer required`

## Supported MVP Question Types

- `single_choice`
- `multiple_choice`
- `scale`
- `rating`
- `yes_no`
- `price`
- `short_text`
- `paragraph`
- `ranking`

## PostgreSQL

The local database runs on port `55432` to avoid colliding with another Postgres already using `5432`.

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

Le seed utilise le bundle `dist/seed.js` dans l’image de production et `tsx prisma/seed.ts` en développement local.

For a clean local reset:

```bash
npm run db:reset
```

## Validation

```bash
npm run typecheck
npm run build
npm run test
npm run audit
npx prisma validate
```

`npm run test` force `NODE_ENV=test`. Les tests e2e nécessitent toutefois PostgreSQL sur `localhost:55432`. Les tests unitaires peuvent être lancés sans base :

```bash
npm run test -- --run test/validators.test.ts test/scores.service.test.ts
```

Pour le stockage local, `API_PUBLIC_URL` définit la base des liens d’upload et de téléchargement générés par l’API. La production exige `STORAGE_DRIVER=r2` (les fichiers locaux ne sont pas persistants dans le service Compose de production), les variables R2 valides et `SMTP_HOST`; sinon les liens de réinitialisation retomberaient sur les logs de développement.

Le pool PostgreSQL est configurable avec `PRISMA_POOL_MIN`, `PRISMA_POOL_MAX`,
`PRISMA_CONNECTION_TIMEOUT_MS` et `PRISMA_STATEMENT_TIMEOUT_MS`. Ces valeurs
sont validées au démarrage et le timeout de requête est transmis directement à
PostgreSQL.

Les uploads locaux vérifient aussi que le nombre d’octets reçu correspond exactement au `contentLength` signé ; un fichier partiel ou plus volumineux est supprimé.

Les recommandations utilisent les heuristiques locales par défaut. Si `IMOLE_API_KEY` est configurée, le provider Imole (`IMOLE_BASE_URL`, `IMOLE_MODEL`) appelle `/v1/responses` avec `gpt-5.6-luna` par défaut et génère des recommandations structurées à partir des analytics agrégés ; toute erreur ou réponse invalide revient automatiquement au provider local.
