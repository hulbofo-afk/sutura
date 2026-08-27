# Sutura — infra

Production infrastructure for the Sutura backend, designed to run on a single
small OVH VPS (2 vCPU / 4 GB RAM / 40 GB SSD) with media storage on Cloudflare R2.

## Topology

```
                    ┌──────────────────────┐
                    │   Cloudflare (DNS)   │
                    │   proxy + CDN + WAF  │
                    └──────────┬───────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
  api.suturamode.com     media.suturamode.com     (other domains)
       │                       │
       │                       └──────► R2 bucket (public, CDN cached)
       │
┌──────▼─────────────── OVH VPS ──────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │  Caddy (:80/:443)  reverse proxy + Let's Encrypt│   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                    │
│  ┌─────────────────▼─────────┐  ┌──────────────────┐   │
│  │  sutura-api (NestJS)      │  │  sutura-backup   │   │
│  │  port 4000                │  │  pg_dump → R2    │   │
│  └────────────┬──────────────┘  └────────┬─────────┘   │
│               │                          │              │
│  ┌────────────▼──────────────────────────▼──────────┐  │
│  │  sutura-postgres (16-alpine)                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## First install (VPS OVH, Debian 12)

### 1. Provision the VPS

OVH VPS Starter (2 vCPU / 4 GB / 40 GB SSD, ~€7/mois), Debian 12.

```bash
ssh debian@<vps-ip>

sudo adduser sutura
sudo usermod -aG sudo sutura
sudo apt update && sudo apt upgrade -y
```

### 2. Harden the host

```bash
sudo apt install -y ufw fail2ban

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable --now fail2ban

sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

Add your public key to `~sutura/.ssh/authorized_keys`, test the key-only
login, then disconnect and reconnect as `sutura`.

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker sutura
newgrp docker
docker --version
docker compose version
```

### 4. Configure Cloudflare

In the Cloudflare dashboard for `suturamode.com`:

- **DNS → Records** — add an `A` record `api` pointing to the VPS IP, **proxy
  enabled** (orange cloud). The proxy handles DDoS, hides the origin IP, and
  lets Caddy obtain a Let's Encrypt cert via the HTTP-01 challenge.
- **DNS → Records** — add a `CNAME` record `media` pointing to the R2 public
  bucket endpoint (visible in R2 → Settings → Public access after you
  connect a custom domain).
- **SSL/TLS** — set encryption mode to **Full (strict)**. Without this,
  Cloudflare connects to the origin over HTTP and the cert chain breaks.
- **Speed → Optimization** — enable **Brotli**.

For media serving, create an R2 bucket (`suturamode-media`) and connect a
public custom domain `media.suturamode.com` (R2 → Settings → Public access →
Custom domain). Cloudflare will issue and serve a free cert for it.

### 5. Create the R2 API token

R2 → Manage R2 API Tokens → Create API token:

- Name: `sutura-prod`
- Permissions: **Object Read & Write** scoped to bucket `suturamode-media`
- TTL: leave blank (or set a reminder to rotate yearly)

Save the Access Key ID and Secret Access Key — they are shown once. Also note
the **Account ID** (R2 → top right of the dashboard).

### 6. Clone and configure

```bash
git clone <repo-url> /opt/sutura
cd /opt/sutura

cd infra
cp .env.production.example .env.production
$EDITOR .env.production
```

Generate strong secrets:

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 16   # POSTGRES_PASSWORD
```

Fill in at minimum:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET` (32+ random bytes, hex or base64)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- `R2_PUBLIC_BASE_URL=https://media.suturamode.com`
- `CADDY_PRIMARY_DOMAIN=api.suturamode.com`
- `ACME_EMAIL=ops@suturamode.com`
- `SMTP_HOST=postfix`, `SMTP_PORT=25`, `SMTP_FROM=no-reply@suturamode.com`

Production deployments require `STORAGE_DRIVER=r2`, valid non-placeholder R2
credentials, HTTPS public URLs, and SMTP. The API refuses to boot with the
development email logger or local upload storage in production.

Les images de base Node, PostgreSQL, Caddy et Postfix sont référencées par
digest pour rendre les builds reproductibles. Toute mise à jour de ces images
doit être volontaire, testée localement, puis livrée dans un commit dédié.

### 7. First deploy

```bash
./deploy.sh
```

This will:

1. Build the API image from the current commit
2. Build the backup image
3. Run `prisma migrate deploy` to apply versioned schema migrations
4. Start `sutura-postgres`, `sutura-api`, `sutura-caddy`, `sutura-backup`
5. Caddy will obtain a Let's Encrypt cert for `api.suturamode.com` on first run
6. Hit the database readiness endpoint to confirm the deployed build

The repository ships a legacy-compatible baseline followed by an additive
alignment migration. A fresh database can be initialized with
`prisma migrate deploy`. The existing VPS database was created before
migration tracking existed, so do not run the first migration against it:
inspect the live schema and take and verify an R2 backup first. The inspected
VPS matches the legacy baseline, so the one-time transition is:

```bash
CONFIRM_LEGACY_BASELINE=I_UNDERSTAND bash ./baseline-existing-db.sh
```

The script checks the expected legacy shape, creates and verifies the R2 backup,
records the existing schema as `20260803000000_init`, then applies
`20260803000001_align_current_mvp` additively. Execute it only after the live
DDL comparison has been reviewed. Future schema changes must be delivered as
new migrations.

To seed the demo creator:

```bash
docker compose exec api npx tsx prisma/seed.ts
```

### 8. Ongoing deploys

The inspected VPS is an archive-based Docker installation, not a Git checkout.
After committing and validating a release locally, package and transfer the
exact Git commit while keeping `.env.production` only on the VPS:

```bash
release="$(bash infra/package-release.sh)"
release_name="$(basename "${release}")"
release_ref="$(git rev-parse --short HEAD)"
scp "${release}" "ubuntu@164.132.196.41:/tmp/${release_name}"
scp infra/install-archive-release.sh "ubuntu@164.132.196.41:/tmp/sutura-install-archive-release.sh"
ssh ubuntu@164.132.196.41 "chmod 700 /tmp/sutura-install-archive-release.sh && /tmp/sutura-install-archive-release.sh /tmp/${release_name}"
ssh ubuntu@164.132.196.41 "cd /opt/sutura/infra && GIT_REF=${release_ref} ./deploy.sh"
```

The packaging script refuses dirty worktrees, tracked non-example environment
files in the release paths, or missing migration files. It archives only
`apps/api` and `infra`, so legacy reference directories and their historical
files are not shipped. Do not copy `.env.production` from the development
machine. The archive installer stages and validates the archive, replaces stale
source files under `apps/api` and `infra`, and preserves the VPS-only
`infra/.env.production` file.

For a fresh server initially installed from a Git checkout, the simpler
`git pull` workflow is still valid; it does not describe the currently
inspected VPS.

```bash
cd /opt/sutura
cd infra
./deploy.sh
```

`deploy.sh` valide la configuration Compose de production avant le build,
classifie la base comme neuve, migrée ou legacy avant toute migration, vérifie
la readiness de la base après redémarrage et restaure automatiquement
l’image API précédente si la nouvelle version échoue. Ce rollback couvre
l’image API uniquement ; les modifications de schéma doivent être livrées par
migration et restent couvertes par une sauvegarde PostgreSQL vérifiée.

`deploy.sh` et `baseline-existing-db.sh` partagent un verrou `flock` sur
`/tmp/sutura-deploy.lock` afin d’empêcher deux opérations de production
concurrentes.

Par défaut, le script exécute aussi un backup R2 vérifié avant `prisma migrate deploy`
(`REQUIRE_PREDEPLOY_BACKUP=true`). Le dump local est gzip-vérifié puis comparé
par taille à l’objet R2. Un échec R2 bloque donc le déploiement avant
toute modification de schéma.

Avant une release qui modifie le schéma, vérifier séparément la sauvegarde :

```bash
docker compose run --rm --no-deps --entrypoint /usr/local/bin/backup.sh backup
```

Ne pas poursuivre une modification de production si cette commande ne produit
pas et n’envoie pas un dump vérifié vers R2.

## Local test (no Cloudflare, no domain)

To verify the API image builds and the database wiring works before going
to the VPS:

```bash
cd infra

# Use the local override (skips Caddy and backup, runs only postgres + api)
docker compose -f docker-compose.local.yml up -d --build

# Health check
curl -fsS http://localhost:4000/api/health

# Logs
docker compose -f docker-compose.local.yml logs -f api

# Seed
docker compose -f docker-compose.local.yml exec api npx tsx prisma/seed.ts

# Tear down (keeps postgres volume)
docker compose -f docker-compose.local.yml down

# Tear down (deletes postgres volume too)
docker compose -f docker-compose.local.yml down -v
```

## Day-to-day operations

### View logs

```bash
cd /opt/sutura/infra
docker compose logs -f api
docker compose logs -f caddy
docker compose logs -f backup
```

### Check backup status

```bash
docker compose logs backup
```

Backups target 03:00 UTC daily and are written to
`r2://suturamode-media/backups/db/`. The 7 most recent daily dumps are kept,
plus 4 weekly snapshots (taken every Sunday).

If the backup container starts after 03:00 UTC, it performs the missed daily
backup immediately once, then resumes the next daily schedule.

The backup image uses a foreground shell scheduler instead of BusyBox
`crond`: some production container profiles deny `setpgid`, which makes
`crond -f` restart repeatedly. A manual end-to-end check is:

```bash
docker compose run --rm --no-deps --entrypoint /usr/local/bin/backup.sh backup
```

This must create and gzip-verify the PostgreSQL dump and then copy it to R2.

### List or restore a backup

```bash
cd /opt/sutura/infra

docker compose run --rm --entrypoint /usr/local/bin/restore.sh backup --list
docker compose run --rm --entrypoint /usr/local/bin/restore.sh backup --latest --confirm
docker compose run --rm --entrypoint /usr/local/bin/restore.sh backup --file sutura-sutura-20260724T030000Z.sql.gz --confirm
```

`restore.sh` runs against the live `postgres` container. The database will be
overwritten. It refuses to run without `--confirm`; stop the API first and
verify the selected backup before proceeding.

### Rotate the JWT secret

`JWT_SECRET` is in `.env.production`. Rotating it invalidates all existing
tokens (users get logged out). To rotate without downtime, you would need a
2-secret grace period (not implemented for the MVP).

### Update the Caddy config

Edit `infra/caddy/Caddyfile`, then:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter ""
```

## Cost summary

| Component        | Free tier                  | Estimated cost (beta)  |
|------------------|----------------------------|------------------------|
| OVH VPS Starter  | —                          | ~€7/mois               |
| Cloudflare DNS   | Free                       | €0                     |
| Cloudflare proxy | Free                       | €0                     |
| R2 storage       | 10 GB                      | €0 until >10 GB        |
| R2 operations    | 10M writes + 100M reads    | €0 for MVP traffic     |
| Domain name      | —                          | ~€10/an                |
| **Total**        |                            | **~€8/mois + €10/an**  |

R2 paid tier kicks in at $0.015/GB/month for storage above 10 GB and
$4.50/M reads above 100M/month.
