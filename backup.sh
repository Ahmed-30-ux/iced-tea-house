#!/bin/bash
set -e

APP_DIR="/var/www/iced-tea-house"
BACKUP_DIR="$APP_DIR/backups"
DB="$APP_DIR/prisma/prod.db"
KEEP_DAYS=14
DATE=$(date +%Y-%m-%d_%H-%M)

if [ ! -f "$DB" ]; then
  echo "[$DATE] ERROR: Database not found at $DB"
  exit 1
fi

# Copy and compress
cp "$DB" "$BACKUP_DIR/prod.db.$DATE"
gzip "$BACKUP_DIR/prod.db.$DATE"

# Delete backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "prod.db.*.gz" -mtime +$KEEP_DAYS -delete

COUNT=$(ls -1 "$BACKUP_DIR"/prod.db.*.gz 2>/dev/null | wc -l)
SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "[$DATE] Backup complete: $COUNT backups, total $SIZE"
