# LinkWeb — 项目启动与运行指南

> 基于 LittleLink 二次开发的现代化自托管个人链接聚合平台。  
> 默认端口：`2222`

## 快速开始

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:2222
```

开发启动脚本会准备本地 SQLite 结构和演示数据。

## 本地开发

```bash
cd Linkweb
cp .env.example .env
npm install
npm run dev
```

最低环境变量：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:2222"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
```

生成密钥：

```bash
openssl rand -base64 32
```

## 演示账号

| 用途 | 地址/账号 |
| --- | --- |
| 登录页 | `http://localhost:2222/auth/signin` |
| 普通演示账号 | `test@pawn.eu.org` |
| 演示密码 | `test123` |
| 演示主页 | `http://localhost:2222/test` |
| 默认公开账号 | `admin@linkweb.local / admin123` |
| 默认公开主页 | `http://localhost:2222/admin` |

独立超级管理员不开放网页注册，需要通过服务器 CLI 创建：

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

## 普通用户控制台

登录后进入：

```text
http://localhost:2222/dashboard
```

核心模块：

- 链接管理：新增、编辑、删除、显示/隐藏、拖拽排序。
- 图标选择：内置社交软件、直播、短视频、音乐、内容、电商、赞助等图标；未选择时使用默认链接图标。
- 外观设置：主题、背景、按钮样式、自定义字体、高级 CSS、打赏配置。
- 数据分析：近 7 天点击趋势、热门链接。
- 账号中心：头像 URL、头像上传、自定义域名绑定。

头像上传支持 JPG、PNG、WEBP、GIF，单文件最大 2MB。Docker 部署中上传文件持久化在 `linkweb-uploads:/app/public/uploads`。

## 自定义域名绑定

在账号中心填写域名，例如：

```text
link.yourbrand.com
```

DNS 配置：

- 根域名建议添加 `A` 记录指向服务器 IP。
- 子域名可添加 `A` 记录指向服务器 IP，也可添加 `CNAME` 指向主站域名。
- 使用 Nginx Proxy Manager 时，为该域名新建 Proxy Host，转发到 `127.0.0.1:2222`。

服务端会规范化 Host，去掉端口后匹配 `User.customDomain`，命中后自动 rewrite 到对应用户公开主页。

## 系统管理后台

后台入口：

```text
http://localhost:2222/sys-admin
```

后台账号体系：

- 超级管理员：由 CLI 创建，拥有全部权限。
- 普通管理员：由超级管理员从普通用户提权，只能看到被授权的菜单和操作。
- 普通管理员之间不能互相修改、封禁、删除、重置密码或编辑权限。

## Docker Compose 生产部署

```bash
cp .env.example .env
docker compose up -d --build
docker compose logs -f linkweb
```

容器启动时会自动执行：

```text
npx prisma migrate deploy
node scripts/ensure-sqlite-schema.mjs
node scripts/seed-admin.mjs
```

正常部署后不需要再手动执行 `migrate deploy`。

检查迁移状态：

```bash
docker compose exec -e NPM_CONFIG_CACHE=/tmp/.npm linkweb npx prisma migrate status
```

常用命令：

```bash
docker compose logs -f linkweb
docker compose restart linkweb
docker compose exec linkweb sh
docker compose down
```

## 环境变量参考

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | SQLite: `file:./dev.db` 或 `file:/app/data/linkweb.db` |
| `NEXTAUTH_URL` | 是 | 本地 `http://localhost:2222`，生产填写实际域名 |
| `NEXTAUTH_SECRET` | 是 | Auth.js 密钥，也用于公开点击 IP 哈希加盐 |
| `GITHUB_CLIENT_ID` / `GITHUB_SECRET` | 否 | GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET` | 否 | Google OAuth |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 否 | Cloudflare Turnstile 前端 site key |
| `TURNSTILE_SECRET_KEY` | 否 | Cloudflare Turnstile 服务端 secret |

## 验证流程

1. 访问 `/auth/signin`，用 `test@pawn.eu.org / test123` 登录。
2. 进入 `/dashboard/links` 添加链接，选择图标并拖拽排序。
3. 进入 `/dashboard/settings` 上传头像或填写头像 URL。
4. 访问 `/test`，确认公开主页只显示 `@test`，头像和图标正常显示。
5. 进入 `/sys-admin`，确认普通管理员不能修改其他管理员账号。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma + SQLite
- Auth.js / NextAuth.js v5
- Zustand
- dnd-kit
- Recharts
- lucide-react

---

LinkWeb is a LittleLink-inspired self-hosted link-in-bio control plane.
