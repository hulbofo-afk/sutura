# API contract — Sutura backend MVP

Base URL locale :

```text
http://localhost:4000/api
```

Toutes les routes privées créateur exigent :

```http
Authorization: Bearer <token>
```

Les routes publiques `/public-tests/:slug` ne doivent pas exiger de token.

## Conventions globales

### Versioning

L'API est versionnée via le header `X-API-Version` (lu côté serveur pour future compat) et exposée via `GET /health` :

```json
{
  "status": "ok",
  "service": "sutura-api",
  "version": "0.1.0",
  "timestamp": "2026-07-24T15:00:00.000Z"
}
```

`GET /health/ready` is public and returns `503` unless PostgreSQL is available
and both the legacy baseline and current-MVP Prisma migrations are recorded as
successfully finished. A successful response is:

```json
{ "status": "ok", "db": "ok", "migrations": "ok" }
```

### Format de réponse paginée

Les endpoints de listing renvoient un wrapper `{ data, meta }` :

```json
{
  "data": [ { ... }, { ... } ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "pages": 3,
    "hasMore": true
  }
}
```

Query params acceptés : `?page=1&limit=20&sort=createdAt:desc&search=...&status=...`

- `page` : 1-indexé, défaut 1
- `limit` : défaut 20, max 100
- `sort` : format `field:dir` (`asc` ou `desc`). Champs autorisés dépendent de la route.
- `search` : full-text basique (ILIKE sur `title` pour collections/tests)

### Format d'erreur

Toutes les erreurs renvoient :

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Fashion test not found",
    "status": 404,
    "path": "/api/fashion-tests/abc",
    "method": "GET",
    "timestamp": "2026-07-24T15:00:00.000Z",
    "details": { "fields": ["title must be a string"] }
  }
}
```

Codes courants : `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `PAYLOAD_TOO_LARGE` (413), `TOO_MANY_REQUESTS` (429), `INTERNAL_ERROR` (500).

### Rate limiting

Les limites principales sont appliquées par IP : login `5/min`, register
`10/min` et `30/h`, forgot-password `5/min` et `20/h`, reset-password `10/min`,
soumission publique `2/10s` et `30/min`, lecture publique `30/s` et `120/min`,
uploads `10/min`. Au-delà : `429 TOO_MANY_REQUESTS`.

In production the API is behind one trusted Caddy proxy; throttling is keyed
by the client IP forwarded through that single hop.

## Auth

### Register

`POST /auth/register`

Body :

```json
{
  "name": "Samsiath Yacoubou",
  "brandName": "Sutura Studio",
  "email": "creator@sutura.app",
  "password": "password123",
  "city": "Cotonou",
  "country": "Benin"
}
```

Response :

```json
{
  "token": "jwt",
  "user": {
    "id": "uuid",
    "email": "creator@sutura.app",
    "name": "Samsiath Yacoubou",
    "brandName": "Sutura Studio",
    "city": "Cotonou",
    "country": "Benin"
  }
}
```

### Login

`POST /auth/login`

Body :

```json
{
  "email": "creator@sutura.app",
  "password": "password123"
}
```

### Me

`GET /auth/me`

Private.

### Forgot password

`POST /auth/forgot-password`

Public. Always returns `200` (no information leak about whether the email exists).

Body :

```json
{ "email": "creator@sutura.app" }
```

Response (200) :

```json
{ "ok": true }
```

Triggers an email with a one-time link valid 60 minutes. Rate limit : 5 req/min and 20 req/hour per IP.

### Reset password

`POST /auth/reset-password`

Public.

Body :

```json
{ "token": "raw_token_from_email_link", "newPassword": "newPassword123" }
```

Validation :
- `token` : min 16 chars, alphanumeric + `-_`
- `newPassword` : min 8 chars

Response (200) :

```json
{ "ok": true }
```

Returns `400` if the token is invalid, expired, or already used.

### Validate reset token

`GET /auth/reset-password/validate?token=...`

Public.

Response (200) :

```json
{ "valid": true }
```

Used by the client UI to check the token before showing the form.

## Collections

### List collections

`GET /collections`

Private.

### Create collection

`POST /collections`

Private.

Body minimal :

```json
{
  "title": "Rose Cotonou",
  "description": "Collection beta",
  "season": "Rentrée 2026",
  "category": "Prêt-à-porter",
  "targetAudience": "Femmes urbaines 22-35 ans",
  "launchDate": "2026-09-15"
}
```

### Update collection

`PATCH /collections/:id`

Private.

### Archive collection

`POST /collections/:id/archive`

Private.

## Models

### Create model

`POST /collections/:collectionId/models`

Private.

Body :

```json
{
  "name": "Veste Sika",
  "description": "Veste structurée",
  "photoUrls": ["/uploads/veste.png"],
  "sketchUrl": "/uploads/sketch.png",
  "videoUrl": "/uploads/video.mp4",
  "colors": ["#E91E63", "#2A2A2A"],
  "desiredPrice": 45000
}
```

### Update model

`PATCH /collections/:collectionId/models/:modelId`

Private.

### Delete model

`DELETE /collections/:collectionId/models/:modelId`

Private.

### Reorder models

`POST /collections/:collectionId/models/reorder`

Private.

Body :

```json
{
  "modelIds": ["model_1", "model_2"]
}
```

## Fashion tests

### List tests

`GET /fashion-tests`

Private.

Optional query :

```text
?collectionId=collection_id
```

### Create test

`POST /collections/:collectionId/fashion-tests`

Private.

Body :

```json
{
  "title": "Aide-nous à choisir les pièces à produire",
  "description": "Trois minutes pour donner ton avis.",
  "settings": {
    "randomizeQuestions": false,
    "requireAllQuestions": true,
    "completionMessage": "Merci pour ton avis.",
    "closesAt": "2026-09-30T23:59:59.000Z",
    "maxResponses": 500,
    "anonymousResponses": false,
    "collectRespondentProfile": ["firstName", "sex", "age", "city", "country", "whatsapp", "email", "profession"]
  }
}
```

### Publish test

`POST /fashion-tests/:testId/publish`

Private.

Response contains share payload :

```json
{
  "testId": "test_id",
  "slug": "rose-cotonou",
  "publicUrl": "/t/rose-cotonou",
  "qrPayload": "/t/rose-cotonou",
  "channels": {
    "whatsapp": "https://wa.me/?text=...",
    "facebook": "https://www.facebook.com/sharer/sharer.php?u=...",
    "instagram": "/t/rose-cotonou",
    "tiktok": "/t/rose-cotonou",
    "copy_link": "/t/rose-cotonou"
  }
}
```

## Questions

`POST /fashion-tests/:testId/questions`

Private.

Body :

```json
{
  "text": "Quel modèle porterais-tu en premier ?",
  "type": "single_choice",
  "required": true,
  "options": ["Veste Sika", "Robe Mina"],
  "helpText": "Choisis une seule réponse"
}
```

Types supportés :

- `single_choice`
- `multiple_choice`
- `scale`
- `rating`
- `yes_no`
- `price`
- `short_text`
- `paragraph`
- `ranking`

Pour `scale`, `rating`, `price`, fournir `min` et `max`.

## Public test

### Get public test

`GET /public-tests/:slug`

Public.

### Submit response

`POST /public-tests/:slug/responses`

Public.

Body :

```json
{
  "respondent": {
    "firstName": "Amina",
    "city": "Cotonou",
    "country": "Benin",
    "email": "amina@example.com"
  },
  "answers": {
    "question_id": "response value"
  },
  "startedAt": "2026-07-24T10:00:00.000Z",
  "completedAt": "2026-07-24T10:02:00.000Z"
}
```

## Analytics and decision support

Private :

- `GET /analytics/:testId`
- `GET /analytics/:testId/responses?page=1&limit=20&sort=createdAt:desc`
- `GET /ai-recommendations/:testId`
- `GET /reports/fashion-tests/:testId.pdf`

The responses endpoint uses the standard `{ data, meta }` pagination wrapper
and returns private respondent answers only for the authenticated creator's
test. Another creator receives `404`.

Expected analytics fields include :

- `desirabilityScore`
- `unsoldRiskScore`
- `summary`
- `kpis`
- `questionBreakdown`
- `modelBreakdown`
- `demographics`
- `funnel`
- `shareChannels`

## Uploads (presigned direct-to-storage)

All routes are private. The mobile client uploads files directly to the storage
provider using a presigned URL, then confirms the upload server-side.

### Sign upload

`POST /uploads/sign`

Body :

```json
{
  "kind": "photo" | "sketch" | "video",
  "contentType": "image/jpeg",
  "contentLength": 1234567
}
```

Validation :

- `kind` must be one of `photo`, `sketch`, `video`
- `contentType` must be in the allowed list for the kind
  - photo: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
  - sketch: `image/svg+xml`, `image/png`, `image/jpeg`, `image/webp`
  - video: `video/mp4`, `video/webm`, `video/quicktime`
- `contentLength` must be ≤ the kind's max
  - photo: 10 MB
  - sketch: 2 MB
  - video: 100 MB

Response (201) :

```json
{
  "key": "models/{creatorId}/{uuid}.jpg",
  "uploadUrl": "https://...",
  "publicUrl": "https://media.suturamode.com/models/.../uuid.jpg",
  "method": "PUT",
  "headers": { "Content-Type": "image/jpeg", "Content-Length": "1234567" },
  "expiresAt": "2026-07-24T15:00:00.000Z"
}
```

Flow :

1. Mobile calls `POST /uploads/sign` and gets `uploadUrl` + `publicUrl`
2. Mobile `PUT`s the file body to `uploadUrl` with the required `headers`
3. Mobile calls `POST /uploads/confirm` with `{ key }`
4. Mobile uses `publicUrl` in the `photoUrls` / `sketchUrl` / `videoUrl` fields

### Confirm upload

`POST /uploads/confirm`

Body :

```json
{ "key": "models/{creatorId}/{uuid}.jpg" }
```

The `key` must start with `models/{callerCreatorId}/` or `sketches/{callerCreatorId}/` or `videos/{callerCreatorId}/`.

Response (200) :

```json
{
  "key": "models/.../uuid.jpg",
  "publicUrl": "https://media.suturamode.com/models/.../uuid.jpg",
  "exists": true,
  "size": 1234567,
  "contentType": "image/jpeg"
}
```

Returns `exists: false` if the object is not yet present (e.g. upload still in flight).

### Delete upload

`DELETE /uploads?key=models/{creatorId}/{uuid}.jpg`

Private. Same ownership rule as confirm.

Response (200) :

```json
{ "key": "models/.../uuid.jpg", "deleted": true }
```

## Important behavior

- A creator must never access another creator’s private resources.
- Public tests are fetched by `slug`, not by creator token.
- Public response submission must validate required questions.
- Analytics/recommendations/reports must only use answers collected for the requested test.
- Uploaded media is stored on the configured backend (`STORAGE_DRIVER=local|r2`). Production uses `r2` (Cloudflare R2 S3-compatible). Local dev writes to `apps/api/uploads/`.
