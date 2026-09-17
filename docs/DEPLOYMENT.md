# Deployment Guide

Instructions for deploying the Iced Tea House Business OS to production.

---

## Production Build

### 1. Build the Application

```bash
npm run build
```

### 2. Start the Production Server

```bash
npm run start
```

The server runs on `http://localhost:3000` by default.

### 3. Environment Variables

Create a `.env` file with production values:

```env
DATABASE_URL="file:./prod.db"
JWT_SECRET="<generate-a-strong-random-secret>"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Iced Tea House <noreply@yourdomain.com>"
```

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## SQLite to PostgreSQL Migration

For production deployments requiring a relational database, switch from SQLite to PostgreSQL:

### 1. Update `prisma/schema.prisma`

Change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update Environment Variable

```env
DATABASE_URL="postgresql://user:password@host:5432/iced_tea_house?schema=public"
```

### 3. Install PostgreSQL Provider

```bash
npm install @prisma/client
npx prisma generate
```

### 4. Push Schema

```bash
npx prisma db push
```

### 5. Seed Data (Optional)

```bash
npm run db:seed
```

### Notes

- SQLite-specific features (like `file:` URLs) are not supported in PostgreSQL.
- The Prisma schema uses standard types (`String`, `Float`, `Boolean`, `DateTime`) that work across both databases.
- Connection pooling is recommended for production PostgreSQL (e.g., PgBouncer or Prisma Accelerate).

---

## Docker Setup

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./data/prod.db
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### Build and Run

```bash
docker compose up -d --build
```

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js — click **Deploy**

### 3. Configure Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `JWT_SECRET` | `<your-secret>` | Production |
| `DATABASE_URL` | `postgresql://...` | Production |
| `SMTP_HOST` | `smtp.example.com` | Production |
| `SMTP_PORT` | `587` | Production |
| `SMTP_USER` | `user@example.com` | Production |
| `SMTP_PASS` | `password` | Production |
| `SMTP_FROM` | `Iced Tea House <noreply@example.com>` | Production |

### 4. Important: Database for Vercel

Vercel's serverless functions are ephemeral — SQLite files will be lost between deployments. Use one of:

- **Vercel Postgres** — Add via Storage tab in dashboard
- **Neon** — Free PostgreSQL hosting at [neon.tech](https://neon.tech)
- **Supabase** — Free PostgreSQL hosting at [supabase.com](https://supabase.com)
- **Railway** — Managed PostgreSQL at [railway.app](https://railway.app)

Update `DATABASE_URL` accordingly after setting up your database provider.

### 5. Post-Deploy

After first deploy, run the seed script (or call `seedDemoDataAction` from the app) to populate demo data.

---

## Monitoring and Maintenance

### Health Checks

The app exposes a standard Next.js server. Check `/login` or `/dashboard` for health.

### Database Backups

For SQLite:

```bash
cp prisma/prod.db prisma/prod.db.backup
```

For PostgreSQL:

```bash
pg_dump $DATABASE_URL > backup.sql
```

Schedule regular backups with cron or your hosting provider's backup feature.

### Log Monitoring

- Check server logs in your hosting dashboard (Vercel Functions, Docker logs, etc.)
- The app logs email failures to `console.error`
- Audit logs are stored in the `AuditLog` database table

### Performance Tips

1. **Enable caching** — Use `unstable_cache` or Redis for frequently accessed analytics
2. **Database indexing** — Add indexes on `businessId`, `date`, and `status` fields for large datasets
3. **Connection pooling** — Use PgBouncer or Prisma Accelerate for PostgreSQL
4. **CDN** — Use Vercel Edge Network or Cloudflare for static assets
5. **Rate limiting** — Add rate limiting to Server Actions for public-facing deployments

### Updates

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run database migrations
npx prisma db push

# Rebuild
npm run build

# Restart
npm run start
```

### Environment Variable Rotation

- Rotate `JWT_SECRET` periodically (this will invalidate all existing sessions)
- Rotate SMTP credentials as needed
- Use secrets management (Vercel Env, Docker secrets, etc.) — never commit `.env` files

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `PrismaClient not generated` | Run `npx prisma generate` |
| `Database does not exist` | Run `npx prisma db push` |
| `JWT verification failed` | Check `JWT_SECRET` matches between server restarts |
| Email not sending | Verify `SMTP_*` env vars; app logs to console if not configured |
| Build fails | Run `npm run lint` to check for errors |
| `NEXT_REDIRECT` error | This is normal during login/logout — it's a redirect response |
