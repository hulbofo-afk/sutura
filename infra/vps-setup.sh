#!/bin/bash
set -euo pipefail

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
log()  { echo -e "${G}[+]${N} $*"; }
warn() { echo -e "${Y}[!]${N} $*"; }
fail() { echo -e "${R}[-]${N} $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "doit être lancé en root (sudo -i)"
APP_USER="ubuntu"
APP_DIR="/opt/sutura"

log "=== 1. Mise à jour système ==="
apt update -qq && apt upgrade -y -qq

log "=== 2. Hardening UFW, fail2ban et SSH ==="
apt install -y -qq ufw fail2ban
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null
install -d -m 0755 /etc/ssh/sshd_config.d
printf '%s\n' 'PasswordAuthentication no' 'KbdInteractiveAuthentication no' 'PermitRootLogin prohibit-password' 'MaxAuthTries 3' > /etc/ssh/sshd_config.d/00-sutura-hardening.conf
sshd -t
systemctl reload ssh

log "=== 3. Installation Docker ==="
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh >/dev/null
fi
usermod -aG docker "$APP_USER"
docker --version
docker compose version

log "=== 4. Vérification du code ==="
[ -d "$APP_DIR/infra" ] || fail "$APP_DIR/infra manquant"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
install -d -m 0700 -o root -g root /var/backups/sutura

log "=== 5. Configuration ==="
cd "$APP_DIR/infra"
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  chmod 600 .env.production
  chown "$APP_USER:$APP_USER" .env.production
  fail "Renseigne .env.production manuellement. Aucun secret fournisseur n'est embarqué dans ce script."
fi

log "=== 6. Build et déploiement ==="
sudo -u "$APP_USER" ./deploy.sh

log "=== 7. Vérifications ==="
curl -fsS https://api.suturamode.com/api/health/ready
log "Setup terminé"
