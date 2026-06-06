# LinkWeb

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

LinkWeb is a self-hosted Link-in-bio control plane for creators, teams, and small communities. It turns a simple public profile into a manageable platform with link editing, themes, analytics, custom domains, user governance, admin permissions, IP bans, maintenance mode, and TOTP two-factor authentication.

简体中文项目说明：LinkWeb 是一个基于 LittleLink 理念二次开发的自托管个人链接聚合平台，同时内置系统管理后台，适合个人部署、团队内部分发和二次开发。

## Why LinkWeb

| Capability | What It Gives You |
| --- | --- |
| Public profile pages | Clean `/:username` pages for links, profile copy, avatars, tips, and custom themes. |
| Link operations | Create, edit, delete, hide, group, and drag-sort links from a private dashboard. |
| Admin console | Manage users, permissions, content review, site settings, maintenance mode, and IP bans from `/sys-admin`. |
| Security controls | TOTP 2FA for users and admins, encrypted recovery-code display, Turnstile support, and ban enforcement. |
| Self-hosted data | SQLite, uploaded assets, and runtime state stay inside your own Docker volume. |
| Production deployment | Multi-stage Docker build, Prisma migrations, runtime schema checks, and health checks are included. |

## Screens And Routes

| Area | Route |
| --- | --- |
| Home | `/` |
| Public profile | `/:username` |
| Sign in | `/auth/signin` |
| User dashboard | `/dashboard` |
| User settings | `/dashboard/settings` |
| Admin console | `/sys-admin` |
| Admin settings | `/sys-admin/settings` |

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Open:

```text
http://localhost:2222
```

If port `2222` is already used:

```bash
npx next dev -p 3333
```

Minimum `.env` values:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:2222"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
TWO_FACTOR_ENCRYPTION_KEY="replace-with-a-secure-random-secret"
```

Generate a strong secret:

```bash
openssl rand -base64 32
```

## Demo Account

```text
Email:    test@pawn.eu.org
Password: test123
Profile:  http://localhost:2222/test
```

Create an independent super admin from the CLI:

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

Admin console:

```text
http://localhost:2222/sys-admin
```

## Two-Factor Authentication

LinkWeb uses TOTP authenticator apps. Email and SMS verification codes are intentionally not used.

- Accounts without 2FA sign in with email and password.
- Accounts with 2FA cannot sign in with password alone; the UI asks them to use the 2FA login path.
- 2FA login supports email plus authenticator code, or email plus one-time recovery code.
- Recovery codes are hashed for verification and encrypted for admin display.
- Disabling 2FA clears the TOTP secret, verification state, and recovery codes immediately.
- Super admins and authorized normal admins can view decryptable recovery codes from the admin console.

Compatible apps include Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden, Aegis, and other TOTP clients.

## Docker Deployment

```bash
docker compose up -d --build
```

Default port mapping:

```yaml
ports:
  - "${PORT:-2222}:3000"
```

The production container runs the bootstrap flow on start:

```text
npx prisma migrate deploy
node scripts/ensure-sqlite-schema.mjs
node scripts/seed-admin.mjs
```

SQLite data and uploaded files are persisted in the Docker volume:

```text
linkwebbeta_linkweb-data
```

## Server Update Flow

Recommended deployment flow with rollback space:

```bash
cd /root/data/docker_data/LinkwebBeta

mkdir -p /root/data/docker_data/backups
old_commit=$(git rev-parse --short HEAD)
stamp=$(date +%Y%m%d-%H%M%S)

tar -czf /root/data/docker_data/backups/linkweb-data-$old_commit-$stamp.tar.gz \
  -C /var/lib/docker/volumes/linkwebbeta_linkweb-data/_data .

git pull origin main
docker compose up -d --build
docker compose ps
docker compose exec -T linkweb npx prisma migrate status
curl -fsS -o /tmp/linkweb-check.html -w "HTTP_STATUS=%{http_code}\n" http://127.0.0.1:2222/auth/signin

cd /root/data/docker_data/backups
ls -1t linkweb-data-*.tar.gz | tail -n +3 | xargs -r rm -f
```

This keeps the two newest data backups, so a bad release does not leave you with only one rollback option.

## Local Git Flow

```powershell
cd D:\code\Linkweb
git status
git add <files>
git commit -m "describe your change"
git push origin main
```

Use targeted `git add` commands when your workspace contains generated files or unrelated local changes.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma + SQLite |
| Authentication | Auth.js / NextAuth.js v5 |
| State | Zustand |
| Drag and drop | dnd-kit |
| Charts | Recharts |
| Icons | lucide-react |

## Project Structure

```text
src/
├─ app/
│  ├─ [username]/           # Public profile pages
│  ├─ auth/                 # Sign-in, registration, and 2FA pages
│  ├─ dashboard/            # User dashboard
│  ├─ sys-admin/            # System admin console
│  ├─ api/                  # App Router route handlers
│  └─ uploads/              # Uploaded asset read route
├─ lib/
│  ├─ auth.ts               # Auth.js configuration
│  ├─ two-factor.ts         # TOTP, QR-Code, and recovery-code logic
│  ├─ two-factor-tokens.ts  # Lightweight 2FA cookie/JWT helpers
│  ├─ admin-session.ts      # Super-admin session handling
│  ├─ admin-action-auth.ts  # Admin action authorization
│  ├─ prisma.ts             # Prisma client
│  └─ ip-ban.ts             # IP/CIDR ban matching
└─ stores/
   └─ dashboard-store.ts

prisma/
├─ schema.prisma
├─ seed.ts
└─ migrations/
```

## Security Notes

- `.env`, `.env.production`, local databases, upload data, and generated artifacts are ignored by Git.
- Public click tracking stores salted IP hashes instead of raw IP addresses.
- Banned users cannot sign in and their public profiles are blocked.
- Normal-admin write actions re-check database permissions at execution time.
- 2FA recovery codes are one-time use and become invalid when 2FA is disabled.

## More

Operational commands and deployment notes live in [RUN_GUIDE.md](./RUN_GUIDE.md).
