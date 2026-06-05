# LinkWeb

LinkWeb 是一个自托管 Link-in-bio 平台，基于 LittleLink 理念二次开发。它提供个人公开主页、链接管理、主题外观、头像上传、打赏入口、访问分析，以及面向站点运营的系统管理后台。

## 功能概览

- 个人公开主页：通过 `/:username` 展示头像、简介、链接列表和主题样式。
- 链接管理：支持新增、编辑、删除、显示/隐藏、拖拽排序和分组。
- 主题与自定义：支持背景、按钮样式、字体、自定义 CSS 和打赏配置。
- 访问分析：记录链接点击数据，公开点击接口使用 IP 哈希保护隐私。
- 自定义域名：根据访问 Host 自动匹配到对应用户公开主页。
- 系统后台：固定入口 `/sys-admin`，支持用户治理、链接审查、全局设置、维护模式、IP 黑名单和权限控制。
- 账号安全：普通用户、普通管理员、超级管理员均支持 TOTP 两步验证，不使用邮件或短信验证码。

## 2FA 规则

LinkWeb 使用验证器 App 的 TOTP 动态码，兼容 Google Authenticator、Microsoft Authenticator、1Password、Bitwarden、Aegis 等工具。

- 未开启 2FA 的账号：使用邮箱和密码登录。
- 已开启 2FA 的账号：密码登录会被拒绝并提示使用 2FA 登录，不会创建会话。
- 2FA 登录入口：输入邮箱和验证器动态码，也可以使用一次性恢复码。
- 恢复码：启用或重置 2FA 时生成，每个恢复码只能使用一次。
- 关闭 2FA：会清空密钥、验证状态和恢复码，旧恢复码立即失效。
- 后台查看恢复码：超级管理员和有用户查看权限的普通管理员可以查看可解密保存的恢复码；旧版本仅哈希保存的恢复码会显示为“旧码不可见”，需要重新生成。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma + SQLite |
| Auth | Auth.js / NextAuth.js v5 |
| State | Zustand |
| Drag & Drop | dnd-kit |
| Charts | Recharts |
| Icons | lucide-react |

## 本地启动

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

默认访问：

```text
http://localhost:2222
```

如果本机 `2222` 已被其他项目占用，可以临时使用其他端口：

```bash
npx next dev -p 3333
```

最低环境变量：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:2222"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
TWO_FACTOR_ENCRYPTION_KEY="replace-with-a-secure-random-secret"
```

生成密钥：

```bash
openssl rand -base64 32
```

## 演示账号

```text
普通演示账号：test@pawn.eu.org
演示密码：test123
演示主页：http://localhost:2222/test
```

独立超级管理员不开放网页注册，需要通过 CLI 创建：

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

后台入口：

```text
http://localhost:2222/sys-admin
```

## Docker 部署

使用 Docker Compose：

```bash
docker compose up -d --build
```

默认端口映射：

```yaml
ports:
  - "${PORT:-2222}:3000"
```

容器启动时会执行：

```text
npx prisma migrate deploy
node scripts/ensure-sqlite-schema.mjs
node scripts/seed-admin.mjs
```

上传文件与 SQLite 数据库持久化在 Docker 数据卷 `linkwebbeta_linkweb-data` 中。

## 本地提交到仓库

```powershell
cd D:\code\Linkweb
git status
git add README.md RUN_GUIDE.md .gitignore
git commit -m "docs: update project guides"
git push origin main
```

如果要提交全部代码改动：

```powershell
git add .
git commit -m "feat: describe your change"
git push origin main
```

如果有不想提交的文件，不要使用 `git add .`，改用指定文件路径。

## 服务器拉取部署

登录服务器后执行：

```bash
cd /root/data/docker_data/LinkwebBeta

mkdir -p /root/data/docker_data/backups
stamp=$(date +%Y%m%d-%H%M%S)
tar -czf /root/data/docker_data/backups/linkweb-data-$stamp.tar.gz \
  -C /var/lib/docker/volumes/linkwebbeta_linkweb-data/_data .

git pull origin main
docker compose up -d --build
docker compose ps
docker compose exec -T linkweb npx prisma migrate status
curl -fsS -o /tmp/linkweb-check.html -w "HTTP_STATUS=%{http_code}\n" http://127.0.0.1:2222/auth/signin
```

## 项目结构

```text
src/
├─ app/
│  ├─ [username]/           # 公开个人主页
│  ├─ auth/                 # 登录、注册、2FA 页面
│  ├─ dashboard/            # 普通用户控制台
│  ├─ sys-admin/            # 系统管理后台
│  ├─ api/                  # API Route Handlers
│  └─ uploads/              # 上传文件读取路由
├─ lib/
│  ├─ auth.ts               # Auth.js 配置
│  ├─ two-factor.ts         # TOTP、二维码、恢复码逻辑
│  ├─ two-factor-tokens.ts  # 2FA Cookie/JWT 轻量工具
│  ├─ admin-session.ts      # 超级管理员 Session
│  ├─ admin-action-auth.ts  # 后台操作鉴权
│  ├─ prisma.ts             # Prisma Client
│  └─ ip-ban.ts             # IP/CIDR 封禁逻辑
└─ stores/
   └─ dashboard-store.ts

prisma/
├─ schema.prisma
├─ seed.ts
└─ migrations/
```

## 安全说明

- `.env`、`.env.production` 和本地数据库文件不进入 Git。
- 公开点击接口不保存原始 IP，而是使用密钥加盐哈希。
- 被封禁用户无法登录，公开主页会进入封禁提示页。
- 普通管理员写操作会实时查询数据库权限，避免 JWT 权限延迟导致越权。
- 2FA 恢复码以哈希用于校验，同时加密保存用于后台查看；关闭 2FA 会立即清空恢复码。
