# Linkweb

> 极客范、数据自主的个人链接聚合中心。  
> Self-hosted Link-in-bio control plane for creators, hackers, builders, and small teams.

Linkweb 是一个开源自托管的 Link-in-bio 平台。它把个人主页、链接管理、主题外观、点击分析、打赏变现和自定义域名绑定收进一套可部署、可迁移、可掌控的系统里。

不再把入口交给第三方平台，不再把访问数据交给黑箱。Linkweb 的目标很简单：你的链接、你的主题、你的域名、你的数据库。

## 🌟 项目简介

Linkweb 是一个现代化个人链接聚合中心，适合用于：

- 创作者主页：聚合社媒、作品集、打赏入口和联系方式。
- 开源项目入口：统一展示文档、仓库、路线图、社区和赞助方式。
- 独立站轻量门户：用自定义域名承载自己的公开身份。
- 自托管实验室：用 SQLite + Docker 快速点火，也能继续扩展为更大的服务。

它不是一个营销页生成器，而是一套面向数据自主的个人入口基础设施。

## ✨ 核心特性

- **响应式公开主页**  
  自动适配桌面端与移动端，展示头像、昵称、简介、链接列表和个性主题。

- **拖拽排序链接管理**  
  后台支持链接新增、编辑、删除、显示/隐藏和拖拽排序，失败时自动回滚前端顺序。

- **高级主题自定义**  
  支持背景颜色/渐变、按钮圆角、模糊效果、多套预设主题，以及自定义 CSS。

- **字体切换**  
  支持系统默认、Serif、Mono、Sans-serif 字体风格，让公开主页更贴近个人气质。

- **去中心化打赏变现**  
  支持 PayPal 邮箱、自定义赞助链接（BuyMeACoffee / Ko-fi / 爱发电等）和 BTC/ETH/SOL 等加密货币地址。

- **点击日志与防刷限流**  
  点击统计使用加盐 IP 哈希保护隐私，并对公开 `/api/visit` 接口加入内存限流，降低恶意刷写对 SQLite 的冲击。

- **数据分析面板**  
  提供 7 日访问趋势、总点击量、热门链接 Top 5、当前可见链接数等基础运营指标。

- **自定义域名绑定**  
  用户可绑定自己的域名，服务端根据 Host 自动 rewrite 到对应公开主页。

- **自托管部署友好**  
  内置 Dockerfile、Docker Compose、Systemd 服务模板和 Nginx 示例配置。

## 🛠️ 技术栈

| 层级 | 技术 |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI Runtime | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma + SQLite |
| Auth | NextAuth.js v5 |
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

GitHub / Google OAuth 可选；未配置时登录页会自动隐藏对应按钮。

### 3. 对齐数据库迁移

项目使用 Prisma migrations 管理结构。新克隆环境请执行：

```bash
npx prisma migrate deploy
```

如果你需要本地测试账号，可运行：

```bash
npx prisma db seed
```

默认种子账号：

```text
admin@linkweb.local / admin123
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问：

```text
http://localhost:2222
```

## 🐳 生产部署

Linkweb 已内置生产部署基础设施：

- `Dockerfile`：多阶段构建，输出 Next.js standalone。
- `docker-compose.yml`：支持通过 `PORT` 环境变量映射端口，默认宿主机 `2222`。
- `linkweb.service`：Systemd 服务模板，使用 `www-data` 低权限用户运行。
- `nginx-linkweb.conf`：反向代理与 HTTPS 示例配置。

Docker Compose 启动示例：

```bash
docker compose up -d --build
docker compose exec linkweb npx prisma migrate deploy
docker compose exec linkweb npx prisma db seed
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

💡 **NPM 反代小贴士**：若使用 Nginx Proxy Manager 管理外部 80/443 域名网关，只需在 NPM 后台新建 Proxy Host，将 `Domain Names` 填入你的漂亮域名，`Forward Name/IP` 填入 `127.0.0.1`，`Forward Port` 稳稳地填入 `2222` 即可。用户访问域名时将完全隐去端口尾巴。

## 📁 项目结构

```text
src/
├── app/
│   ├── page.tsx                # 产品首页
│   ├── [username]/             # 公开个人主页
│   ├── auth/                   # 登录、注册、认证错误页
│   ├── dashboard/              # 后台管理界面
│   └── api/                    # Next.js Route Handlers
├── lib/
│   ├── auth.ts                 # NextAuth 配置
│   └── prisma.ts               # Prisma Client 单例
└── stores/
    └── dashboard-store.ts      # Zustand 状态

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## 🔐 安全说明

- `.env`、`.env.production` 和本地数据库文件不会进入 Git。
- 公开点击接口使用加盐 IP 哈希，不存储原始 IP。
- 生产服务模板默认使用低权限用户运行。
- 如曾经在脚本中暴露过服务器密码或云主机 IP，请立即轮换相关凭据。

## 🧭 开源仓库

GitHub: [bedlatess/LinkwebBeta](https://github.com/bedlatess/LinkwebBeta)

---

Built for people who want a public identity without giving up the keys.
