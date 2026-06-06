# LinkWeb

<p align="center">
  <strong>A self-hosted Link-in-bio control plane with user dashboards, admin governance, custom domains, analytics, Docker deployment, and TOTP 2FA.</strong>
</p>

<p align="center">
  <a href="#english">English</a>
  ·
  <a href="#zh-cn">简体中文</a>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs"></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white"></a>
  <a href="https://www.prisma.io/"><img alt="Prisma" src="https://img.shields.io/badge/Prisma-SQLite-2d3748?style=for-the-badge&logo=prisma"></a>
  <a href="https://www.docker.com/"><img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ed?style=for-the-badge&logo=docker&logoColor=white"></a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Auth.js" src="https://img.shields.io/badge/Auth.js-NextAuth_v5-111827?style=flat-square">
  <img alt="2FA" src="https://img.shields.io/badge/2FA-TOTP-green?style=flat-square">
  <img alt="Self-hosted" src="https://img.shields.io/badge/Self--hosted-yes-success?style=flat-square">
</p>

---

<a id="english"></a>

## English

<p align="right"><a href="#zh-cn">Read this document in 简体中文</a></p>

### Overview

LinkWeb is a self-hosted Link-in-bio platform for creators, developers, small teams, and private communities. It starts with the familiar idea of a public profile page, then adds everything needed to operate it as a real application: link management, visual customization, click analytics, custom domains, user administration, permission control, IP bans, maintenance mode, Docker deployment, and TOTP two-factor authentication.

The project is inspired by lightweight link-profile tools such as LittleLink, but it is built as a full control plane: public pages for visitors, dashboards for users, and a system admin console for operators.

### What You Can Build With It

| Area | What LinkWeb Provides |
| --- | --- |
| Public profiles | Clean `/:username` pages with avatar, bio, grouped links, icons, custom themes, and tip links. |
| User dashboard | A private control panel for managing profile settings, links, appearance, analytics, avatar uploads, domains, and 2FA. |
| Admin console | A system backend at `/sys-admin` for user governance, content review, site settings, permissions, maintenance tasks, and IP bans. |
| Security | TOTP 2FA, encrypted recovery-code storage, Turnstile support, account bans, IP bans, and real-time admin permission checks. |
| Self-hosting | Docker Compose, SQLite persistence, Prisma migrations, runtime schema checks, and volume-based uploads. |
| Operations | Backup-first deployment commands, rollback-friendly data backups, health checks, and maintenance utilities. |

### Key Features

#### Public Profile Pages

- Human-readable profile routes: `/:username`
- Avatar, display name, username, and bio
- Link list with visibility control and sorting
- Built-in link icons powered by `lucide-react`
- Custom backgrounds, button styles, fonts, blur, and custom CSS
- Optional tip/donation entry points
- Custom domain matching by request host

#### Link Management

- Create, edit, delete, show, hide, group, and reorder links
- Drag-and-drop sorting with optimistic UI
- Per-link icons and public URL validation
- User-owned data isolation
- Admin-side content review and takedown support

#### User Dashboard

- Dashboard home and navigation shell
- Link editor and live phone preview
- Appearance editor
- Analytics overview
- Profile settings
- Avatar upload and external avatar URL support
- Custom domain binding
- Personal 2FA setup, verification, recovery-code regeneration, and disable flow

#### Admin Console

- Independent super-admin account system
- Normal admin role for elevated regular users
- Fine-grained permissions for user governance, link review, global settings, authentication settings, and maintenance
- User creation, edit, ban, unban, delete, entitlement toggles, and permission configuration
- Global link review pool
- Maintenance mode toggle
- IP and CIDR ban rules
- Site title, SEO, favicon, support contact, registration, OAuth, and admin 2FA policy settings
- Recovery-code visibility for super admins and authorized normal admins

#### Security And 2FA

LinkWeb uses TOTP authenticator apps. Email and SMS verification codes are intentionally not used.

- Accounts without 2FA sign in with email and password.
- Accounts with 2FA cannot sign in with password alone.
- The UI tells 2FA-enabled users to use the 2FA login path.
- 2FA login supports email plus authenticator code.
- 2FA login also supports one-time recovery codes.
- Recovery codes are hashed for verification and encrypted for admin display.
- Disabling 2FA clears the TOTP secret, verification state, and all recovery codes.
- Super admins and authorized normal admins can view decryptable recovery codes in the admin console.

Compatible apps include Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden, Aegis, and other TOTP clients.

### Route Map

| Route | Purpose |
| --- | --- |
| `/` | Product/home page |
| `/:username` | Public profile page |
| `/auth/signin` | User sign-in and registration entry |
| `/auth/2fa` | User 2FA verification challenge |
| `/dashboard` | User dashboard |
| `/dashboard/links` | Link management |
| `/dashboard/appearance` | Theme and appearance settings |
| `/dashboard/analytics` | User analytics |
| `/dashboard/settings` | Profile, domain, avatar, and 2FA settings |
| `/sys-admin/login` | System admin login |
| `/sys-admin` | Admin overview |
| `/sys-admin/users` | User governance |
| `/sys-admin/links` | Global link review |
| `/sys-admin/settings` | Site, authentication, and admin 2FA settings |
| `/sys-admin/maintenance` | Cleanup and IP ban operations |

### Tech Stack

| Layer | Stack |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma + SQLite |
| Authentication | Auth.js / NextAuth.js v5 |
| Admin session | Custom signed JWT cookie for independent super-admin sessions |
| 2FA | TOTP via `otplib`, QR-Code generation, encrypted backup-code records |
| State | Zustand |
| Drag and drop | dnd-kit |
| Charts | Recharts |
| Icons | lucide-react |
| Deployment | Docker Compose |

### Quick Start

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

### Demo Account

```text
Email:    test@pawn.eu.org
Password: test123
Profile:  http://localhost:2222/test
```

Create an independent super admin:

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

Admin console:

```text
http://localhost:2222/sys-admin
```

### Docker Deployment

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

### Recommended Server Update Flow

This flow keeps rollback space by preserving the two newest data backups.

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

### Local Git Flow

```powershell
cd D:\code\Linkweb
git status
git add <files>
git commit -m "describe your change"
git push origin main
```

Use targeted `git add` commands when your workspace contains generated files or unrelated local changes.

### Project Structure

```text
src/
|-- app/
|   |-- [username]/           # Public profile pages
|   |-- auth/                 # Sign-in, registration, and 2FA pages
|   |-- dashboard/            # User dashboard
|   |-- sys-admin/            # System admin console
|   |-- api/                  # App Router route handlers
|   `-- uploads/              # Uploaded asset read route
|-- lib/
|   |-- auth.ts               # Auth.js configuration
|   |-- two-factor.ts         # TOTP, QR-Code, and recovery-code logic
|   |-- two-factor-tokens.ts  # Lightweight 2FA cookie/JWT helpers
|   |-- admin-session.ts      # Super-admin session handling
|   |-- admin-action-auth.ts  # Admin action authorization
|   |-- prisma.ts             # Prisma client
|   `-- ip-ban.ts             # IP/CIDR ban matching
`-- stores/
    `-- dashboard-store.ts

prisma/
|-- schema.prisma
|-- seed.ts
`-- migrations/
```

### Security Notes

- `.env`, `.env.production`, local databases, upload data, and generated artifacts are ignored by Git.
- Public click tracking stores salted IP hashes instead of raw IP addresses.
- Banned users cannot sign in and their public profiles are blocked.
- Normal-admin write actions re-check database permissions at execution time.
- 2FA recovery codes are one-time use and become invalid when 2FA is disabled.

### More

Operational commands and deployment notes live in [RUN_GUIDE.md](./RUN_GUIDE.md).

---

<a id="zh-cn"></a>

## 简体中文

<p align="right"><a href="#english">Read this document in English</a></p>

### 项目概览

LinkWeb 是一个自托管 Link-in-bio 平台，适合创作者、开发者、小团队和私有社区使用。它不只是一个公开链接页，还提供了完整的用户控制台和系统管理后台：链接管理、主题配置、点击分析、自定义域名、用户治理、管理员权限、IP 封禁、维护模式、Docker 部署和 TOTP 两步验证都已经内置。

项目灵感来自 LittleLink 这类轻量链接主页工具，但 LinkWeb 的定位更接近一个完整控制台：访客访问公开主页，普通用户管理自己的主页，系统管理员负责站点治理和全局配置。

### 你可以用它做什么

| 模块 | 能力说明 |
| --- | --- |
| 公开主页 | 使用 `/:username` 展示头像、简介、链接、图标、分组、主题和打赏入口。 |
| 用户控制台 | 管理个人资料、链接、外观、访问数据、头像、自定义域名和个人 2FA。 |
| 系统后台 | 在 `/sys-admin` 管理用户、权限、内容审查、站点设置、维护任务和 IP 黑名单。 |
| 安全体系 | 支持 TOTP 2FA、恢复码加密展示、Turnstile、账号封禁、IP 封禁和实时权限校验。 |
| 自托管数据 | SQLite、上传资源和运行时数据都保存在自己的 Docker 数据卷中。 |
| 生产部署 | 内置多阶段 Docker 构建、Prisma 迁移、运行时结构检查和健康检查。 |

### 核心功能

#### 公开个人主页

- 人类可读的公开路由：`/:username`
- 头像、昵称、用户名和简介
- 链接列表、显示/隐藏和排序
- 基于 `lucide-react` 的内置链接图标
- 自定义背景、按钮样式、字体、模糊效果和高级 CSS
- 可选打赏/赞助入口
- 基于请求 Host 自动匹配自定义域名

#### 链接管理

- 新增、编辑、删除、显示、隐藏、分组和排序
- 拖拽排序和乐观更新
- 每个链接可选择图标
- 用户数据隔离
- 后台可进行全站链接审查和下架

#### 普通用户控制台

- 控制台首页和侧边导航
- 链接编辑器和手机预览
- 外观主题编辑
- 点击数据分析
- 个人资料设置
- 头像上传和头像外链
- 自定义域名绑定
- 个人 2FA 启用、验证、恢复码重置和关闭

#### 系统管理后台

- 独立超级管理员账号体系
- 普通用户可被提升为普通管理员
- 用户治理、链接审查、全局设置、认证设置、维护任务等细粒度权限
- 新增用户、编辑用户、封禁、解封、删除、权益开关和权限配置
- 全站链接审查池
- 维护模式开关
- IP/CIDR 黑名单
- 站点标题、SEO、favicon、支持入口、注册开关、OAuth 开关和后台 2FA 策略
- 超级管理员和有权限的普通管理员可查看恢复码

#### 安全与 2FA

LinkWeb 使用验证器 App 的 TOTP 动态码，不使用邮件或短信验证码。

- 未开启 2FA 的账号使用邮箱和密码登录。
- 已开启 2FA 的账号不能只用密码登录。
- 前端会提示 2FA 用户使用两步验证登录入口。
- 2FA 登录支持邮箱 + 验证器动态码。
- 2FA 登录也支持一次性恢复码。
- 恢复码使用哈希校验，并加密保存用于后台展示。
- 关闭 2FA 会立即清空 TOTP 密钥、验证状态和全部恢复码。
- 超级管理员和有权限的普通管理员可以在后台查看可解密恢复码。

兼容 Google Authenticator、Microsoft Authenticator、1Password、Bitwarden、Aegis 和其他 TOTP 工具。

### 路由地图

| 路由 | 作用 |
| --- | --- |
| `/` | 产品首页 |
| `/:username` | 用户公开主页 |
| `/auth/signin` | 用户登录和注册入口 |
| `/auth/2fa` | 用户 2FA 验证页 |
| `/dashboard` | 用户控制台 |
| `/dashboard/links` | 链接管理 |
| `/dashboard/appearance` | 外观主题设置 |
| `/dashboard/analytics` | 用户数据分析 |
| `/dashboard/settings` | 个人资料、域名、头像和 2FA 设置 |
| `/sys-admin/login` | 系统后台登录 |
| `/sys-admin` | 后台概览 |
| `/sys-admin/users` | 用户治理 |
| `/sys-admin/links` | 全站链接审查 |
| `/sys-admin/settings` | 站点、认证和后台 2FA 设置 |
| `/sys-admin/maintenance` | 清理任务和 IP 黑名单 |

### 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 16 App Router |
| UI | React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | Prisma + SQLite |
| 认证 | Auth.js / NextAuth.js v5 |
| 超级管理员会话 | 自定义签名 JWT Cookie |
| 2FA | `otplib` TOTP、二维码生成、加密恢复码 |
| 状态管理 | Zustand |
| 拖拽排序 | dnd-kit |
| 图表 | Recharts |
| 图标 | lucide-react |
| 部署 | Docker Compose |

### 快速开始

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

访问：

```text
http://localhost:2222
```

如果 `2222` 端口被占用：

```bash
npx next dev -p 3333
```

最低 `.env` 配置：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:2222"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
TWO_FACTOR_ENCRYPTION_KEY="replace-with-a-secure-random-secret"
```

生成强密钥：

```bash
openssl rand -base64 32
```

### 演示账号

```text
邮箱：test@pawn.eu.org
密码：test123
主页：http://localhost:2222/test
```

创建独立超级管理员：

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

后台入口：

```text
http://localhost:2222/sys-admin
```

### Docker 部署

```bash
docker compose up -d --build
```

默认端口映射：

```yaml
ports:
  - "${PORT:-2222}:3000"
```

生产容器启动时会执行：

```text
npx prisma migrate deploy
node scripts/ensure-sqlite-schema.mjs
node scripts/seed-admin.mjs
```

SQLite 数据库和上传文件持久化在 Docker 数据卷：

```text
linkwebbeta_linkweb-data
```

### 推荐服务器更新流程

这个流程会保留最近两个数据备份，避免只有一个回退点时也救不回来。

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

### 本地 Git 流程

```powershell
cd D:\code\Linkweb
git status
git add <files>
git commit -m "describe your change"
git push origin main
```

当工作区存在生成文件或无关改动时，建议使用指定文件路径 `git add`，不要直接 `git add .`。

### 项目结构

```text
src/
|-- app/
|   |-- [username]/           # 公开个人主页
|   |-- auth/                 # 登录、注册和 2FA 页面
|   |-- dashboard/            # 用户控制台
|   |-- sys-admin/            # 系统管理后台
|   |-- api/                  # App Router API 路由
|   `-- uploads/              # 上传资源读取路由
|-- lib/
|   |-- auth.ts               # Auth.js 配置
|   |-- two-factor.ts         # TOTP、二维码和恢复码逻辑
|   |-- two-factor-tokens.ts  # 轻量 2FA Cookie/JWT 工具
|   |-- admin-session.ts      # 超级管理员会话
|   |-- admin-action-auth.ts  # 后台操作鉴权
|   |-- prisma.ts             # Prisma Client
|   `-- ip-ban.ts             # IP/CIDR 封禁匹配
`-- stores/
    `-- dashboard-store.ts

prisma/
|-- schema.prisma
|-- seed.ts
`-- migrations/
```

### 安全说明

- `.env`、`.env.production`、本地数据库、上传数据和生成产物不会进入 Git。
- 公开点击统计保存加盐 IP 哈希，不保存原始 IP。
- 被封禁用户无法登录，公开主页也会被阻断。
- 普通管理员写操作会实时检查数据库权限。
- 2FA 恢复码只能使用一次，关闭 2FA 后立即失效。

### 更多

更详细的运行、部署和排查命令见 [RUN_GUIDE.md](./RUN_GUIDE.md)。
