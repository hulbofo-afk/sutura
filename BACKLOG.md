# Sutura — backlog de transition

> **Architecture active (28 août 2026) : Next.js + Convex dans `apps/web`.**
> Ce fichier conserve le backlog et les décisions du backend NestJS historique (`apps/api`) pour traçabilité. Les nouvelles tâches doivent être ajoutées dans la roadmap Convex ci-dessous, sauf décision d’architecture explicite.

## Roadmap active — Convex

1. Réglages éditables des tests, édition et réordonnancement des questions/modèles.
2. Questionnaire public complet : randomisation effective, classement visuel et présentation des modèles.
3. Validation des uploads, nettoyage des médias orphelins et protection anti-abus.
4. Agrégation/anonymisation du payload IA, timeout/retry et validation de sortie Imole.
5. Analytics avancées, rapport frontend et tests Playwright mobile/desktop.
6. Préparation production puis décision sur le retrait du backend NestJS historique.

## Backlog historique — NestJS/PostgreSQL

Priorité historique : terminer un backend MVP complet et robuste avant le branchement Flutter.

## P0 — À faire avant connexion mobile

1. ✅ Durcir les validations métier
2. ✅ Auth : login + signup + forgot/reset password
3. ✅ Upload médias R2 (StorageService + presigned URLs)
3. Pagination/filtres/recherche
4. Contrat API mobile stable

- ✅ Empêcher publication si :
  - aucun modèle ;
  - aucune question ;
  - question obligatoire invalide ;
  - question liée à un `modelId` inexistant ou hors collection ;
  - `closesAt` déjà passé ;
  - `maxResponses` inférieur aux réponses déjà reçues.
- ✅ Valider les réponses publiques par type :
  - `single_choice` doit correspondre à une option ;
  - `multiple_choice` doit être une liste d’options valides ;
  - `scale/rating/price` doivent respecter `min/max` ;
  - `yes_no` doit être booléen ;
  - `ranking` doit contenir les options attendues sans doublon.
- ✅ Refuser les `questionId` inconnus.
- ✅ Refuser les réponses qui violent les champs `collectRespondentProfile` si `anonymousResponses: false`.
- ✅ Tests unitaires + e2e ajoutés (`test/validators.test.ts`, `test/app.e2e.test.ts`).

Implémenté dans `src/services/validators.ts` (logique pure) et exposé via les services.

### 2. Upload médias ✅

Besoin MVP :

- Upload photo modèle multiple.
- Upload croquis optionnel.
- Upload vidéo optionnelle.
- Suppression/remplacement d'un média.

Implémentation recommandée :

- Commencer par stockage local dev dans `apps/api/uploads`.
- Prévoir interface de service pour remplacer ensuite par S3/R2/Supabase Storage.
- Ne jamais exposer de chemin système local dans les réponses API.

✅ Fait le 2026-07-24 :

- `StorageService` abstraite + 2 impls : `LocalStorageService` (dev, écrit dans `apps/api/uploads/`) et `R2StorageService` (prod via `@aws-sdk/client-s3` S3-compatible, marche avec Cloudflare R2)
- Sélection via `STORAGE_DRIVER=local|r2` (défaut `local`)
- 3 routes privées :
  - `POST /uploads/sign` → retourne une URL présignée (R2 S3) ou un URL local signé HMAC (token 10 min) que le mobile PUT directement
  - `POST /uploads/confirm` → vérifie l'objet (HeadObject), retourne `publicUrl` + size + contentType
  - `DELETE /uploads?key=...` → supprime l'objet, ownership vérifié
- Validation stricte :
  - `kind` ∈ {photo, sketch, video}
  - `contentType` doit matcher la whitelist du kind
  - `contentLength` ≤ max du kind (photo 10 MB, sketch 2 MB, video 100 MB)
  - `key` doit commencer par `models/{creatorId}/`, `sketches/{creatorId}/` ou `videos/{creatorId}/`
- 9 tests e2e nouveaux (sign, bad contentType, bad size, sign+PUT+confirm full flow, bad token, ownership confirm, ownership delete, token round-trip)
- Driver configurable via `STORAGE_DRIVER=local|r2` (défaut `local`)

### 3. Pagination, filtres et recherche ✅

À ajouter sur :

- `GET /api/collections`
- `GET /api/fashion-tests`
- réponses publiques privées côté analytics

✅ Fait le 2026-07-24 :

- `src/common/pagination.ts` — `SearchPaginationDto` + `PaginatedResult<T>` + `buildMeta()`
- `GET /collections?page=&limit=&sort=&search=&status=` — `{ data: CollectionSummary[], meta: { total, page, limit, pages, hasMore } }`
- `GET /fashion-tests?page=&limit=&sort=&search=&status=&collectionId=` — idem
- Tri sur `title` ou `createdAt` (asc/desc), search ILIKE sur `title`
- 1 test e2e ajouté (pagination comportement)
- 47/47 tests verts

Filtres utiles :

- statut ;
- collection ;
- période ;
- recherche texte ;
- tri récent/ancien.

### 4. Contrat API mobile

Ajouter un document ou package léger pour stabiliser les payloads :

- soit `apps/api/API_CONTRACT.md` ;
- soit `packages/contracts` plus tard si nécessaire.

Ne pas créer `packages/contracts` tant qu’il n’est pas vraiment consommé.

## P1 — Qualité produit backend

### 5. Analytics avancés

Améliorer :

- stats par modèle ;
- taux d’abandon par question ;
- distribution prix ;
- signaux forts/faibles ;
- segmentations simples par ville, âge, sexe.

Sortie attendue :

- un résumé exécutif lisible pour mobile ;
- des séries faciles à afficher dans des charts Flutter.

### 6. Recommandations IA branchables

État actuel :

- recommandations heuristiques locales par défaut ; provider Imole structuré disponible si `IMOLE_API_KEY` est défini, avec fallback local.

Complété :

- interface `RecommendationProvider`.
- provider local par défaut.
- provider Imole via endpoint `/v1/responses` avec sortie JSON structurée.
- envoi des analytics agrégés uniquement, sans réponses brutes.
- fallback local automatique en cas d’erreur réseau/API ou de sortie invalide.
- ne jamais inventer des insights non présents dans les réponses.

### 7. Export PDF amélioré

Ajouter :

- identité collection/test ;
- KPIs ;
- graphiques simples ;
- top questions ;
- recommandations ;
- date export ;
- avertissement si échantillon faible.

### 8. Audit sécurité ✅

À vérifier :

- `JWT_SECRET` obligatoire hors dev ;
- rate limiting auth/public response ;
- CORS maîtrisé ;
- taille max uploads ;
- types MIME uploads ;
- logs sans secrets ;
- ownership sur toutes les requêtes relationnelles (✅ déjà centralisé dans `src/services/ownership.ts`).

✅ Fait le 2026-07-24 :

- `JwtModule.registerAsync` lève si `NODE_ENV=production` et `JWT_SECRET` manquant ou < 32 chars
- `@nestjs/throttler` configuré : 60 req/min global, 10/min sur `/auth/*`, 30/min sur `/public-tests/:slug`, 5/min sur `/auth/login` (anti-bruteforce)
- Throttler désactivé en `NODE_ENV=test` (pour les e2e)
- `src/common/global-exception.filter.ts` : format erreur unifié `{ error: { code, message, status, path, method, timestamp, details? } }`
- Logs : 5xx → `logger.error`, 4xx → `logger.warn`, jamais de secrets dans les logs (JWT masqué, password non loggué)
- `CORS` : `PUBLIC_APP_URL` ou `http://localhost:5173` en dev
- Uploads : taille max par kind (photo 10MB, sketch 2MB, video 100MB) + MIME whitelisted
- ValidationPipe global via `APP_PIPE` (whitelist + transform + forbidNonWhitelisted)

## P2 — Après backend MVP

- Notifications/alertes créateur.
- Templates de questions.
- Duplication de test.
- Archivage/restauration plus complet.
- Export CSV réponses.
- Webhooks ou événements internes.

## Refactor de structuration ✅

Le `StoreService` (god class de 643 lignes) a été découpé en services dédiés :

- `CollectionsService` — collections + listing de modèles.
- `ModelsService` — CRUD modèles + reorder.
- `FashionTestsService` — tests, questions, partage, share events.
- `PublicResponsesService` — fetch public par slug + soumission de réponse (sans auth).
- `AnalyticsService` — analytics + recommandations heuristiques.
- `ReportsService` — export PDF streaming.

Helpers extraits (non `@Injectable`, fonctions pures) :

- `src/services/ownership.ts` — `findOwnedCollection/Test/Model/Question` qui lèvent `NotFoundException` si l’ownership n’est pas respecté.
- `src/services/mappers.ts` — `mapCollection/Model/Question/Test/Settings` (Prisma → API shape).
- `src/services/validators.ts` — assertions métier pures (questions, réponses, publication).
- `src/services/slug.ts` — génération de slug unique.
- `src/services/shuffle.ts` — Fisher-Yates (corrige le `stableShuffle` qui était en fait un `sort` déterministe par `JSON.stringify`).

`StoreService` supprimé. Tous les controllers et le module sont branchés sur les nouveaux services.

## Infra VPS OVH + R2 ✅

Décision validée : backend NestJS sur petit VPS OVH (2 vCPU / 4 GB / ~€7/mois), médias sur Cloudflare R2 (free tier 10 GB), DB Postgres dans le même VPS via Docker.

Domaine cible : **`suturamode.com`** (API sur `api.suturamode.com`, médias sur `media.suturamode.com`).

Stack mise en place sous `infra/` :

- `infra/docker-compose.yml` — 5 services : `postgres` (interne au réseau Docker), `api` (NestJS), `caddy` (reverse proxy + HTTPS auto), `backup` (cron pg_dump → R2), `migrate` (one-shot `prisma db push`, profil opt-in).
- `infra/docker-compose.local.yml` — override local (postgres + api + init), pour valider le build et le wiring avant d'aller sur le VPS.
- `infra/caddy/Caddyfile` — reverse proxy paramétré via `{$CADDY_PRIMARY_DOMAIN}`, HSTS, headers de sécurité, redirect `www → apex`.
- `infra/backup/` — image custom `postgres:16-alpine + rclone + dcron`, dump quotidien à 03:00 UTC, rotation (7 daily + 4 weekly), restore via `restore.sh --list|--latest|--file <name>`.
- `infra/deploy.sh` — `git pull` + build image + `prisma db push` + restart + health check HTTPS.
- `infra/.env.production.example` — template documenté.
- `infra/README.md` — checklist première install (hardening VPS, UFW, fail2ban, SSH clé, install Docker, config Cloudflare DNS + SSL Full strict, R2 bucket + token, premier deploy) + procédure de test local.
- `apps/api/Dockerfile` — multi-stage (deps → build → prod-deps → runtime) avec user non-root, healthcheck `/api/health`, label `git.ref`, bundle du seed via esbuild en `dist/seed.js`, copie de `prisma.config.ts` au runtime.
- `apps/api/.dockerignore` — exclusions propres.

Coût cible : **~€8/mois + €10/an** (nom de domaine). R2 reste gratuit tant qu'on reste sous 10 GB et 10M writes/mois.

**Test local validé (podman-compose)** : build image OK, postgres up, init pousse le schéma + seed, API healthy, login + public test + analytics fonctionnels, 37/37 tests verts.

### Bugs runtime corrigés pendant le test local

- `prisma.config.ts` n'était pas copié dans l'image runtime → `prisma db push` échouait. Ajout de la ligne `COPY --from=build /app/prisma.config.ts ./prisma.config.ts` dans le Dockerfile.
- Le seed importait depuis `../src/data/seed` qui n'existe pas en prod → déplacement de `src/data/seed.ts` vers `prisma/seed-data.ts` (co-localisé avec le script de seed) et bundle esbuild en `dist/seed.js` (pour ne pas avoir besoin de `tsx` dans l'image prod).
- `tsconfig` avait `allowSyntheticDefaultImports: true` sans `esModuleInterop: true` → en runtime compilé, `bcryptjs.default` était `undefined` et l'auth login plantait silencieusement. Ajout de `esModuleInterop: true`.
- `prisma db push` en Prisma 7 n'accepte plus `--skip-generate` (flag supprimé). Retiré du migrate service.

## Décisions Cloudflare

- **DNS** : `api.suturamode.com` (A vers VPS, **proxy activé** — orange cloud) ; `media.suturamode.com` (CNAME vers bucket R2 public).
- **SSL/TLS** : encryption mode **Full (strict)** côté Cloudflare → Caddy. Caddy émet le cert via Let's Encrypt (HTTP-01) au premier démarrage.
- **R2** : bucket `suturamode-media` en accès public via custom domain `media.suturamode.com` (CDN Cloudflare cache tout, egress 0€).

### Procédure Cloudflare à exécuter depuis le dashboard

1. **DNS** : `api.suturamode.com` (A vers IP VPS, proxy ON) + `media.suturamode.com` (CNAME vers le endpoint R2 fourni)
2. **SSL/TLS → Overview** : encryption mode = **Full (strict)**
3. **Speed → Optimization** : Brotli ON
4. **R2 → Create bucket** : `suturamode-media`
5. **R2 → bucket → Settings → Public access → Custom domain** : connecter `media.suturamode.com` (Cloudflare délivre un cert auto)
6. **R2 → Manage R2 API Tokens → Create** :
   - Name `sutura-prod`
   - Permissions : Object Read & Write, bucket = `suturamode-media`
   - Récupérer : Account ID, Access Key ID, Secret Access Key

## MCP Cloudflare

5 MCPs branchés dans `~/.config/opencode/opencode.jsonc` :
- `cloudflare` (R2, DNS, comptes) — OAuth
- `cloudflare-docs` (public, pas d'auth)
- `cloudflare-bindings` (Workers bindings) — OAuth
- `cloudflare-builds` (Pages builds) — OAuth
- `cloudflare-observability` — OAuth

⚠️ Les MCPs ne sont actifs qu'**après le prochain restart d'opencode** + première auth via `opencode mcp auth cloudflare`. Une fois fait, je peux provisionner R2, DNS, et le custom domain media. directement depuis l'agent.

## Tests à maintenir

Commandes :

```bash
npm run typecheck
npm run build
npm run test
npm audit --audit-level=moderate
npx prisma validate
```

État actuel (2026-07-24) : **37 tests** verts (23 unit validators + 2 unit scores + 12 e2e).

Scénario e2e cible :

1. Register/login créateur.
2. Créer collection.
3. Ajouter plusieurs modèles.
4. Créer Fashion Test.
5. Ajouter questions de chaque type MVP.
6. Publier.
7. Lire le test public sans token.
8. Soumettre réponse publique sans token.
9. Consulter analytics avec token.
10. Générer recommandation avec token.
11. Exporter rapport PDF avec token.

## Notes d’implémentation

- Préférer des services NestJS petits et testables plutôt qu’un `StoreService` qui grossit trop.
- Le `StoreService` actuel peut être découpé ensuite en :
  - `CollectionsService`
  - `ModelsService`
  - `FashionTestsService`
  - `PublicResponsesService`
  - `AnalyticsService`
  - `ReportsService`
- Garder le questionnaire public sans auth.
- Garder les routes créateur strictement protégées.
