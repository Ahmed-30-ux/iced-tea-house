#!/bin/bash
set -e

# ============================================
# ICED TEA HOUSE — VPS Deploy Script
# Tested on: Ubuntu 22.04, Debian 12
# Usage: curl -sL https://raw.githubusercontent.com/you/repo/main/deploy.sh | bash
# ============================================

APP_NAME="iced-tea-house"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/YOUR_USERNAME/iced-tea-house.git"  # <-- CHANGE THIS
DOMAIN=""  # <-- CHANGE THIS (e.g., icedteahouse.com) — leave empty for IP-only
NODE_VERSION=20

echo "🧊 Iced Tea House — Deploying..."

# --- 1. System dependencies ---
echo "📦 Installing system dependencies..."
apt update -qq
apt install -y curl git build-essential

# --- 2. Node.js ---
if ! command -v node &>/dev/null; then
  echo "📥 Installing Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
  apt install -y nodejs
fi
echo "Node: $(node -v) | npm: $(npm -v)"

# --- 3. PM2 ---
if ! command -v pm2 &>/dev/null; then
  echo "📥 Installing PM2..."
  npm install -g pm2
  pm2 startup systemd -u root --hp /root
fi

# --- 4. Clone / update repo ---
if [ ! -d "$APP_DIR" ]; then
  echo "📥 Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "📥 Pulling latest changes..."
  cd "$APP_DIR"
  git pull
fi

cd "$APP_DIR"

# --- 5. Install dependencies ---
echo "📦 Installing npm dependencies..."
npm ci --omit=dev

# --- 6. Environment ---
if [ ! -f .env ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  cat > .env <<EOF
DATABASE_URL="file:./prod.db"
JWT_SECRET="$JWT_SECRET"
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Iced Tea House <receipts@icedteahouse.com>"
EOF
  echo "✅ Created .env with random JWT_SECRET"
fi

# --- 7. Database ---
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push --skip-generate

# Seed if database is empty (check for users table)
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as c FROM User" 2>/dev/null || echo "0")
if echo "$USER_COUNT" | grep -q '"c":0'; then
  echo "🌱 Seeding database..."
  npx tsx prisma/seed.ts
fi

# --- 8. Build ---
echo "🔨 Building application..."
npm run build

# --- 9. Start with PM2 ---
echo "🚀 Starting application..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs --name "$APP_NAME"
pm2 save

# --- 10. Nginx (optional) ---
if [ -n "$DOMAIN" ] && ! command -v nginx &>/dev/null; then
  echo "🌐 Installing Nginx..."
  apt install -y nginx
  
  cat > /etc/nginx/sites-available/$APP_NAME <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3111;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
  ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "✅ Nginx configured for $DOMAIN"
fi

echo ""
echo "============================================"
echo "  🧊 ICED TEA HOUSE — DEPLOYED!"
echo "============================================"
echo ""
echo "  App:    http://$(hostname -I | awk '{print $1}'):3111"
if [ -n "$DOMAIN" ]; then
  echo "  Domain: http://$DOMAIN"
fi
echo ""
echo "  Login:  owner@icedteahouse.com"
echo "  Pass:   password123"
echo ""
echo "  PM2:    pm2 logs $APP_NAME"
echo "  Restart: pm2 restart $APP_NAME"
echo "============================================"
