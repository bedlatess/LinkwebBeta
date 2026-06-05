# LinkWeb 运行与部署指南

本文记录本地开发、上传仓库、服务器拉取部署和常用排查命令。

## 1. 本地开发

进入项目目录：

```powershell
cd D:\code\Linkweb
```

安装依赖：

```powershell
npm install
```

复制环境变量：

```powershell
copy .env.example .env
```

生成 Prisma Client：

```powershell
npx prisma generate
```

启动开发服务：

```powershell
npm run dev
```

默认地址：

```text
http://localhost:2222
```

如果 `2222` 被占用，使用其他端口：

```powershell
npx next dev -p 3333
```

## 2. 环境变量

最低配置：

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

可选配置：

```env
GITHUB_CLIENT_ID=""
GITHUB_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_SECRET=""
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
```

## 3. 演示与后台账号

普通演示账号：

```text
邮箱：test@pawn.eu.org
密码：test123
主页：http://localhost:2222/test
```

后台入口：

```text
http://localhost:2222/sys-admin
```

创建独立超级管理员：

```powershell
npm run admin:create -- --email=admin@pawn.eu.org --name="PAWN"
```

## 4. 2FA 操作要点

- 用户、普通管理员、超级管理员都可以启用 2FA。
- 开启 2FA 后，密码登录会提示使用 2FA 方式登录。
- 2FA 登录使用邮箱 + 验证器动态码，也支持恢复码。
- 关闭 2FA 后，密钥、验证状态和恢复码都会清空，旧恢复码立即失效。
- 后台用户管理页可以查看可解密保存的恢复码；旧哈希恢复码会显示为“旧码不可见”。

## 5. 本地代码上传到仓库

先查看改动：

```powershell
cd D:\code\Linkweb
git status
```

只提交文档和忽略规则：

```powershell
git add README.md RUN_GUIDE.md .gitignore
git commit -m "docs: update project guides"
git push origin main
```

提交全部代码改动：

```powershell
git add .
git commit -m "feat: describe your change"
git push origin main
```

确认本地和远程最新提交：

```powershell
git rev-parse --short HEAD
git ls-remote origin refs/heads/main
```

注意：如果工作区里有不想提交的文件，不要用 `git add .`，改用 `git add 文件路径`。

## 6. 服务器从仓库拉取并部署

登录服务器：

```powershell
ssh root@155.248.195.94
```

进入部署目录：

```bash
cd /root/data/docker_data/LinkwebBeta
```

备份 Docker 数据卷：

```bash
mkdir -p /root/data/docker_data/backups
stamp=$(date +%Y%m%d-%H%M%S)
tar -czf /root/data/docker_data/backups/linkweb-data-$stamp.tar.gz \
  -C /var/lib/docker/volumes/linkwebbeta_linkweb-data/_data .
```

拉取并重建：

```bash
git pull origin main
docker compose up -d --build
```

检查容器：

```bash
docker compose ps
docker compose logs --tail=80 linkweb
```

检查迁移：

```bash
docker compose exec -T linkweb npx prisma migrate status
```

检查页面：

```bash
curl -fsS -o /tmp/linkweb-check.html -w "HTTP_STATUS=%{http_code}\n" http://127.0.0.1:2222/auth/signin
```

## 7. 一键部署命令

登录服务器后可直接执行：

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

## 8. 常用排查

查看最近提交：

```bash
git log --oneline -5
```

查看容器日志：

```bash
docker compose logs -f linkweb
```

进入容器：

```bash
docker compose exec linkweb sh
```

重启服务：

```bash
docker compose restart linkweb
```

查看数据库迁移状态：

```bash
docker compose exec -T linkweb npx prisma migrate status
```

临时回到某个旧提交：

```bash
git checkout <commit>
docker compose up -d --build
```

回到 main 最新版：

```bash
git checkout main
git pull origin main
docker compose up -d --build
```
