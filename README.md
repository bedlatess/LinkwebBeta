# Linkweb

> 基于 [LittleLink](https://littlelink.io) 二次开发的开源自托管 Link-in-bio 平台。  
> A self-hosted link-in-bio control plane for creators, hackers, builders, and small teams.

Linkweb 把公开个人主页、链接管理、主题外观、点击分析、打赏变现、自定义域名、系统后台和安全治理整合进一套可部署、可迁移、可掌控的系统里。

它的目标很直接：你的链接、你的主题、你的域名、你的数据库。

## 🌟 项目简介

Linkweb 适合这些场景：

- 创作者主页：聚合社媒、作品集、打赏入口和联系方式。
- 开源项目入口：统一展示文档、仓库、路线图、社区和赞助方式。
- 独立站轻量门户：用自定义域名承载自己的公开身份。
- 自托管实验室：用 SQLite + Docker 快速点火，也能继续扩展为更大的服务。
- 小团队链接基础设施：用系统后台管理用户、内容、权限、站点开关和安全规则。

公开个人主页使用 `/:username` 路由；系统管理后台固定在 `/sys-admin`。`admin` 可以作为普通用户公开主页用户名使用，不再和后台路径冲突。

## ✨ 核心特性

- **响应式公开主页**  
  自动适配桌面端与移动端，主视觉保留 `@username`，展示头像、简介、链接列表、主题、字体和高级 CSS。

- **拖拽排序链接管理**  
  普通用户控制台支持链接新增、编辑、删除、显示/隐藏和拖拽排序，后端同步失败时自动回滚前端顺序。

- **内置平台图标选择**
  链接编辑器内置社交软件、直播平台、短视频平台、内容平台、音乐平台、电商与赞助图标；用户未选择时自动使用默认链接图标。

- **头像上传与外链头像**
  账号中心支持直接上传头像或填写头像 URL，保存后同步到公开主页和控制台侧边栏。

- **高级主题自定义**  
  支持背景颜色/渐变、按钮圆角、模糊效果、多套预设主题、自定义 CSS、系统默认/Serif/Mono/Sans-serif 字体切换。

- **去中心化打赏变现**  
  支持 PayPal 邮箱、自定义赞助链接（BuyMeACoffee / Ko-fi / 爱发电等）和加密货币收款地址。

- **站点级品牌配置**
  后台可配置 Site Title、SEO Description、公告、页脚、GitHub 地址、支持邮箱、联系管理员入口和站点图标。联系入口支持 `mailto:`、Telegram、WhatsApp、Discord、QQ、微信客服页和任意 HTTPS 链接。

- **密码与注册安全**
  注册密码最低 6 个字符，并且大写字母、小写字母、数字、符号四类中至少命中两类。注册入口可由后台一键关闭。

- **点击日志与防刷限流**  
  `/api/visit` 使用 `NEXTAUTH_SECRET` 加盐哈希 IP，不存储原始 IP；接口带 1 分钟 60 次的限流保护，异常高频 IP 会自动写入封禁规则。

- **账号/IP 封禁与封禁页**
  被封禁用户无法登录，公开主页会跳转到专属 `/banned` 页面；IP 被封禁时也会显示同一套安全提示页，并可通过后台配置的联系入口申诉。

- **系统管理后台**
  `/sys-admin` 支持独立超级管理员账号和被提权的普通管理员账号，内置用户管理、内容审查、全局设置、数据清理、IP 黑名单等模块。

- **精细化权限控制**
  普通管理员可被授予查看用户、封禁用户、编辑用户、重置密码、内容审查、站点配置、维护模式、数据清理等细分权限；高危权限带二次确认，写操作实时查询数据库权限位。普通管理员之间不能互相修改、封禁、删除或重置密码，避免权限链路紊乱。

- **IP/CIDR 封禁**
  支持手动封禁单 IP 或 CIDR 网段，也支持点击接口自动检测恶意流量后封禁。为避免误封，`/sys-admin` 后台、独立超级管理员会话和普通管理员会话会自动进入白名单。

- **自定义域名绑定**  
  用户可绑定自己的域名，服务端会规范化 Host 并根据 `customDomain` 自动 rewrite 到对应公开主页。

- **自托管部署友好**  
  内置 Dockerfile、Docker Compose、Systemd 服务模板、Nginx 示例配置和生产启动脚本。

## 🛠️ 技术栈

| 层级 | 技术 |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI Runtime | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma + SQLite |
| Auth | Auth.js / NextAuth.js v5 |
| Admin Session | jose + HttpOnly Cookie |
| State | Zustand |
| Drag & Drop | dnd-kit |
| Charts | Recharts |
| Icons | lucide-react |

## 🚀 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制模板并填写必要配置：

```bash
cp .env.example .env
```

最低需要：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:2222"
NEXTAUTH_SECRET="replace-with-a-secure-random-secret"
```

生成 `NEXTAUTH_SECRET`：

```bash
openssl rand -base64 32
```

GitHub / Google OAuth 可选；未配置时登录页会自动隐藏对应按钮。Cloudflare Turnstile 可选，配置后会保护登录与注册接口。

### 3. 对齐数据库迁移

```bash
npx prisma migrate deploy
npx prisma generate
```

本地开发也可以使用：

```bash
npx prisma migrate dev
```

### 4. 初始化演示用户与超级管理员

生产启动脚本会执行 `scripts/seed-admin.mjs`，默认准备：

```text
普通演示账号：test@pawn.eu.org / test123
演示主页：http://localhost:2222/test
默认公开账号：admin@linkweb.local / admin123
```

独立超级管理员必须通过服务器 CLI 创建：

```bash
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

脚本会提示输入密码，并将密码用 bcrypt 哈希后写入 `AdminUser` 表。超级管理员密码也可以在后台右上角入口修改，CLI 方式仍保留用于应急恢复。

### 5. 启动开发服务器

```bash
npm run dev
```

访问：

```text
http://localhost:2222
```

## 🧑‍💻 管理后台

后台入口：

```text
http://localhost:2222/sys-admin
```

后台支持两条登录链路：

- **超级管理员**：由 `scripts/create-admin.ts` 或 `scripts/create-admin.mjs` 在服务器终端创建，拥有全部权限。
- **普通管理员**：普通 `User` 被超级管理员提权为 `ADMIN` 后，可用自己的邮箱和密码登录后台，只能看到被授权的菜单和操作。

后台模块：

- 仪表盘：总用户、总链接、活跃管理员等数据。
- 用户管理：新增用户、封禁/解封、删除、编辑资料、重置密码、权限配置。
- 内容审查：查看全站链接池，删除违规链接。
- 全局设置：站点标题、SEO、公告、页脚、OAuth、注册开关、维护模式、站点图标、联系管理员入口。
- 数据清理：清理过期会话、空链接，管理 IP/CIDR 封禁规则。

## 🐳 生产部署

Linkweb 已内置生产部署基础设施：

- `Dockerfile`：多阶段构建，输出 Next.js standalone。
- `docker-compose.yml`：支持通过 `PORT` 环境变量映射端口，默认宿主机 `2222`。
- `linkweb.service`：Systemd 服务模板，使用 `www-data` 低权限用户运行。
- `nginx-linkweb.conf`：反向代理与 HTTPS 示例配置。

Docker Compose 启动示例：

```bash
docker compose up -d --build
```

容器启动时会自动执行 `npx prisma migrate deploy`，随后运行 SQLite 结构保底脚本和演示账号初始化脚本。正常部署不需要在 `docker compose up` 之后再手动执行一次迁移。

如需单独检查迁移状态：

```bash
docker compose exec -e NPM_CONFIG_CACHE=/tmp/.npm linkweb npx prisma migrate status
```

默认映射：

```text
http://localhost:2222
http://your-server-ip:2222
```

也可以通过 `.env` 或 shell 环境变量指定端口：

```bash
PORT=8080 docker compose up -d --build
```

💡 **NPM 反代小贴士**：若使用 Nginx Proxy Manager 管理外部 80/443 域名网关，只需在 NPM 后台新建 Proxy Host，将 `Domain Names` 填入你的漂亮域名，`Forward Name/IP` 填入 `127.0.0.1`，`Forward Port` 填入 `2222` 即可。用户访问域名时将完全隐去端口尾巴。

## 📁 项目结构

```text
src/
├── app/
│   ├── page.tsx                 # 产品首页
│   ├── [username]/              # 公开个人主页
│   ├── banned/                  # 账号/IP 封禁提示页
│   ├── auth/                    # 前台登录、注册、认证页面
│   ├── dashboard/               # 普通用户控制台
│   ├── sys-admin/               # 系统管理后台
│   └── api/                     # Next.js Route Handlers
├── lib/
│   ├── auth.ts                  # Auth.js 配置
│   ├── admin-action-auth.ts     # 后台统一鉴权
│   ├── admin-session.ts         # 超管 HttpOnly Cookie Session
│   ├── ip-ban.ts                # IP/CIDR 封禁匹配
│   ├── link-icons.ts            # 链接图标注册表
│   ├── password-policy.ts       # 注册密码策略
│   └── prisma.ts                # Prisma Client 单例
└── stores/
    └── dashboard-store.ts       # Zustand 状态

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## 🔐 安全说明

- `.env`、`.env.production` 和本地数据库文件不会进入 Git。
- 公开点击接口使用加盐 IP 哈希，不存储原始 IP。
- IP 封禁支持 CIDR，但后台路径和管理员会话自动白名单，避免误封导致无法解除。
- 超级管理员账号不开放 Web 注册，只能通过服务器 CLI 创建。
- 普通管理员写操作会实时查询数据库权限位，避免 JWT 权限更新延迟造成越权。
- 生产服务模板默认使用低权限用户运行。
- 如曾经在脚本中暴露过服务器密码、云主机 IP 或密钥，请立即轮换相关凭据。

## 🧭 开源仓库

GitHub: [bedlatess/LinkwebBeta](https://github.com/bedlatess/LinkwebBeta)

## 🙏 致谢

Linkweb 是基于 [LittleLink](https://littlelink.io) 理念与开源生态进行的二次开发版本，在原本轻量链接聚合思路之上扩展了自托管后台、权限系统、安全治理、打赏、点击分析和生产部署能力。

---

Built for people who want a public identity without giving up the keys.
