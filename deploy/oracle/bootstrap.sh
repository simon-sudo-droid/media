#!/usr/bin/env bash
# One-time setup for a fresh Oracle Cloud VM (Ubuntu 22.04/24.04, x86 or ARM).
#
# Installs Docker, opens the web ports at the OS level, and clones the repo.
# Run it once as the default `ubuntu` user:
#
#   curl -fsSL https://raw.githubusercontent.com/simon-sudo-droid/media/master/deploy/oracle/bootstrap.sh | bash
#
# Then: cd ~/editmentor/deploy/oracle, create .env, and bring the stack up.
set -euo pipefail

REPO="${REPO:-https://github.com/simon-sudo-droid/media.git}"
BRANCH="${BRANCH:-master}"
DEST="${DEST:-$HOME/editmentor}"

echo "==> Installing Docker Engine + Compose plugin"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc
fi
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Allowing the current user to run docker without sudo"
sudo usermod -aG docker "$USER" || true

# ── The Oracle gotcha ────────────────────────────────────────────
# Oracle's Ubuntu images ship with a restrictive iptables INPUT chain that
# REJECTs everything except SSH. Opening 80/443 in the VCN security list is
# NOT enough — the host firewall silently drops the traffic too, which looks
# exactly like "the server is down". Fix both layers.
echo "==> Opening ports 80/443 in the host firewall (iptables)"
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
# Persist across reboots.
sudo apt-get install -y iptables-persistent netfilter-persistent
sudo netfilter-persistent save
echo "    (Also open 80 and 443 as Ingress Rules in the OCI VCN security list.)"

echo "==> Cloning the repository"
if [ -d "$DEST/.git" ]; then
  git -C "$DEST" fetch --all --quiet && git -C "$DEST" reset --hard "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$DEST"
fi

echo
echo "==> Done. Next steps:"
echo "    1) Log out and back in (so docker group membership applies)"
echo "    2) cd $DEST/deploy/oracle"
echo "    3) cp .env.example .env && nano .env      # set API_DOMAIN, DATABASE_URL, JWT_SECRET, CORS_ORIGINS, FRONTEND_URL"
echo "    4) Point your DNS A record for API_DOMAIN at this VM's public IP"
echo "    5) docker compose -f docker-compose.prod.yml up -d --build"
echo "    6) curl https://<API_DOMAIN>/health"
