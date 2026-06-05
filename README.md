# LinkWeb

LinkWeb 是一个基于 LittleLink 理念二次开发的自托管 Link-in-bio 平台。它提供个人公开主页、链接管理、主题外观、头像上传、打赏入口、访问分析，以及面向站点运营的系统管理后台。

## 主要能力

- 个人公开主页：通过 `/:username` 展示头像、简介、链接列表和主题样式。
- 链接管理：支持新增、编辑、删除、显示/隐藏、拖拽排序和分组。
- 主题与高级自定义：支持背景、按钮样式、字体、自定义 CSS、打赏配置。
- 访问分析：记录链接点击数据，公开点击接口使用 IP 哈希保护隐私。
- 自定义域名：根据访问 Host 自动匹配到对应用户公开主页。
- 系统后台：固定入口 `/sys-admin`，支持用户治理、链接审查、全局设置、维护模式、IP 黑名单和权限控制。
- 账号安全：普通用户、普通管理员、超级管理员均支持 TOTP 两步验证，不使用邮件或短信验证码。

## 2FA 登录规则

LinkWeb 使用验证器 App 的 TOTP 动态码，兼容 Google Authenticator、Microsoft Authenticator、1Password、Bitwarden、Aegis 等工具。

- 未开启 2FA 的普通账号：使用邮箱和密码登录。
- 已开启 2FA 的普通账号：密码输入正确也不会创建会话，前端会提示“该账号已开启 2FA 功能，请使用两步验证方式登录”，并要求使用 2FA 登录入口。
- 2FA 登录入口：输入邮箱和验证器动态码，也可以使用一次性恢复码。
- 恢复码：启用或重置时生成，每个恢复码只能使用一次。
- 关闭 2FA：会清空密钥、验证状态和恢复码，旧恢复码立即失效；重新启用时必须生成新的恢复码。
- 后台查看恢复码：超级管理员和有用户查看权限的普通管理员可以在后台查看可解密保存的恢复码；旧版本仅哈希保存的恢复码会显示为“旧码不可见”，需要重新生成。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| Framework | Next.js App Router |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Prisma + SQLite |
| Auth | Auth.js / NextAuth |
| State | Zustand |
| Drag & Drop | dnd-kit |
| Icons | lucide-react |

## 快速启动

安装依赖：

```bash
npm install
```

复制环境变量：

```bash
cp .env.example .env
```

最低需要配置：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:2222"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
```

建议单独配置 2FA 加密密钥；未配置时会回退使用 `NEXTAUTH_SECRET` 或 `AUTH_SECRET`：

```env
TWO_FACTOR_ENCRYPTION_KEY="replace-with-a-secure-random-secret"
```

初始化数据库：

```bash
npx prisma migrate deploy
npx prisma generate
```

启动开发服务：

```bash
npm run dev
```

默认访问：

```text
http://localhost:2222
```

如果本机 `2222` 已被占用，可以临时使用其他端口：

```bash
npx next dev -p 3333
```

## 演示账号

```text
邮箱：test@pawn.eu.org
密码：test123
主页：http://localhost:2222/test
```

独立超级管理员不开放网页注册，需要通过 CLI 创建：

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

## 系统后台

后台入口：

```text
http://localhost:2222/sys-admin
```

账号体系：

- 超级管理员：通过服务器 CLI 创建，拥有全部后台权限。
- 普通管理员：由超级管理员从普通用户提权，可按权限显示菜单和执行操作。

后台模块：

- 仪表盘：查看用户、链接、管理员等概览数据。
- 用户管理：新增用户、编辑用户、封禁/解封、删除、权限配置，并可查看 2FA 恢复码。
- 内容审查：查看全站链接池，删除违规链接。
- 全局设置：配置站点标题、SEO、注册开关、OAuth 开关、维护模式、站点 favicon、联系管理员入口和后台 2FA 策略。
- 数据清理：清理过期会话、空链接等数据。
- IP 黑名单：支持单 IP 和 CIDR 网段封禁。

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

容器启动时会执行数据库迁移和生产初始化脚本。上传文件与 SQLite 数据库会持久化在 Docker 数据卷中。

如果使用 Nginx Proxy Manager，只需要将外部域名转发到：

```text
Forward Name/IP: 127.0.0.1
Forward Port: 2222
```

## 项目结构

```text
src/
├─ app/
│  ├─ page.tsx              # 产品首页
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

- `.env` 和本地数据库文件不进入 Git。
- 公开点击接口不保存原始 IP，而是使用密钥加盐哈希。
- 被封禁用户无法登录，公开主页会进入封禁提示页。
- 普通管理员写操作会实时查询数据库权限，避免 JWT 权限延迟导致越权。
- 2FA 恢复码以哈希用于校验，同时加密保存用于后台查看；关闭 2FA 会立即清空恢复码。
