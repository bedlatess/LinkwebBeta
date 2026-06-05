import { getAdminActor } from "@/lib/admin-action-auth";
import { getGlobalSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";
import { getBackupCodeDisplay } from "@/lib/two-factor";
import {
  AlertTriangle,
  Bell,
  GitBranch,
  Globe2,
  LockKeyhole,
  Mail,
  Save,
  Search,
  ShieldCheck,
  Type,
  UserPlus,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  toggleMaintenanceMode,
  toggleOauthEnabled,
  toggleRequireAdminTwoFactor,
  toggleRegistrationEnabled,
  updateSiteBasics,
} from "./settings-actions";
import { AdminTwoFactorCard } from "./admin-two-factor-card";
import { SiteIconUploader } from "./site-icon-uploader";

function SwitchVisual({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        enabled
          ? "border-emerald-300/30 bg-emerald-400/40"
          : "border-white/10 bg-white/10"
      }`}
    >
      <span
        className={`h-4.5 w-4.5 rounded-full bg-white shadow-lg transition ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </span>
  );
}

function FieldImpact({
  label,
  effect,
}: {
  label: string;
  effect: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white/80">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/42">{effect}</p>
    </div>
  );
}

function FeatureFlagCard({
  title,
  description,
  enabled,
  action,
  icon: Icon,
  tone = "emerald",
  disabled = false,
}: {
  title: string;
  description: string;
  enabled: boolean;
  action: () => Promise<void>;
  icon: typeof UserPlus;
  tone?: "emerald" | "amber";
  disabled?: boolean;
}) {
  const enabledClass =
    tone === "amber"
      ? "border-amber-300/25 bg-amber-400/12 text-amber-200"
      : "border-emerald-300/20 bg-emerald-400/12 text-emerald-300";
  const enabledTextClass =
    tone === "amber" ? "text-amber-200" : "text-emerald-200";

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={disabled}
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left shadow-2xl shadow-black/15 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
      >
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              enabled
                ? enabledClass
                : "border-white/10 bg-white/[0.04] text-white/35"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/85">{title}</p>
            <p className="mt-1 text-sm leading-6 text-white/45">
              {description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`text-xs font-medium ${
              enabled ? enabledTextClass : "text-white/35"
            }`}
          >
            {disabled ? "无权限" : enabled ? "已开启" : "已关闭"}
          </span>
          <SwitchVisual enabled={enabled} />
        </div>
      </button>
    </form>
  );
}

export default async function AdminSettingsPage() {
  const actor = await getAdminActor();
  const canManageSiteSettings = actor?.permissions.permManageSiteSettings;
  const canManageAuthSettings = actor?.permissions.permManageAuthSettings;
  const canToggleMaintenance = actor?.permissions.permToggleMaintenance;

  if (!actor) {
    redirect("/sys-admin/login");
  }

  if (!canManageSiteSettings && !canManageAuthSettings && !canToggleMaintenance) {
    redirect(
      `/sys-admin?toast=${encodeURIComponent("当前管理员没有全局设置权限")}`
    );
  }

  const settings = await getGlobalSiteSettings();
  const adminTwoFactor =
    actor.type === "SUPER_ADMIN"
      ? await prisma.adminUser.findUnique({
          where: { id: actor.adminId },
          select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
        })
      : await prisma.user.findUnique({
          where: { id: actor.userId },
          select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
        });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300/70">
              Site Settings
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              全局站点配置
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              管理站点基础 SEO、公开展示文案、支持入口，并用 Feature Flags 控制注册与社交登录入口。
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/55">
            Global ID: {settings.id}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          action={updateSiteBasics}
          className={`rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl ${
            canManageSiteSettings ? "" : "opacity-55"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/12 text-cyan-300">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/85">
                基础信息
              </h2>
              <p className="text-sm text-white/38">
                用于首页、登录页、SEO 与公开提示。
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="siteTitle"
                className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Site Title
              </label>
              <input
                id="siteTitle"
                name="siteTitle"
                defaultValue={settings.siteTitle}
                required
                disabled={!canManageSiteSettings}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <div>
              <label
                htmlFor="seoDescription"
                className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
              >
                <Search className="h-3.5 w-3.5" />
                SEO Description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                defaultValue={settings.seoDescription}
                rows={5}
                disabled={!canManageSiteSettings}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="supportEmail"
                  className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Support Email
                </label>
                <input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  defaultValue={settings.supportEmail ?? ""}
                  placeholder="support@example.com"
                  disabled={!canManageSiteSettings}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div>
                <label
                  htmlFor="githubUrl"
                  className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  GitHub Repository
                </label>
                <input
                  id="githubUrl"
                  name="githubUrl"
                  defaultValue={settings.githubUrl}
                  placeholder="https://github.com/..."
                  disabled={!canManageSiteSettings}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.035] p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/12 text-cyan-200">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white/82">
                    联系管理员入口
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-white/42">
                    用于封禁页和登录页的求助入口。支持 mailto、Telegram、WhatsApp、Discord、QQ 客服链接、微信客服页或任意 HTTPS 地址。
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
                <div>
                  <label
                    htmlFor="adminContactLabel"
                    className="mb-1.5 block text-xs font-medium text-white/50"
                  >
                    按钮文案
                  </label>
                  <input
                    id="adminContactLabel"
                    name="adminContactLabel"
                    defaultValue={settings.adminContactLabel ?? ""}
                    placeholder="联系管理员"
                    disabled={!canManageSiteSettings}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adminContactUrl"
                    className="mb-1.5 block text-xs font-medium text-white/50"
                  >
                    联系链接
                  </label>
                  <input
                    id="adminContactUrl"
                    name="adminContactUrl"
                    defaultValue={settings.adminContactUrl ?? ""}
                    placeholder="mailto:support@example.com / https://t.me/yourname / https://wa.me/..."
                    disabled={!canManageSiteSettings}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/32">
                示例：mailto:support@example.com、https://t.me/linkweb、https://wa.me/8613800000000、https://qm.qq.com/cgi-bin/qm/qr?k=...、https://discord.gg/...
              </p>
            </div>

            <SiteIconUploader
              initialUrl={settings.siteIconUrl ?? ""}
              disabled={!canManageSiteSettings}
            />

            <div>
              <label
                htmlFor="footerText"
                className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
              >
                <Type className="h-3.5 w-3.5" />
                Footer Copyright
              </label>
              <input
                id="footerText"
                name="footerText"
                defaultValue={settings.footerText}
                disabled={!canManageSiteSettings}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.035] p-4">
              <label className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12 text-emerald-200">
                    <Bell className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white/82">
                      首页公告条
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-white/42">
                      开启后会显示在产品首页主视觉上方，适合发布维护通知、版本更新或邀请信息。
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  name="announcementEnabled"
                  defaultChecked={settings.announcementEnabled}
                  disabled={!canManageSiteSettings}
                  className="h-4 w-4 shrink-0 accent-emerald-300"
                />
              </label>
              <textarea
                id="announcementText"
                name="announcementText"
                defaultValue={settings.announcementText ?? ""}
                rows={3}
                placeholder="例如：LinkWeb Beta 正在开放邀请测试。"
                disabled={!canManageSiteSettings}
                className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-emerald-300/45 focus:ring-2 focus:ring-emerald-300/10"
              />
            </div>

            <button
              type="submit"
              disabled={!canManageSiteSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200"
            >
              <Save className="h-4 w-4" />
              保存基础设置
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <FeatureFlagCard
            title="站点维护模式"
            description="开启后，除 /sys-admin 后台外，首页、登录页、公开主页和普通 API 将统一返回 503 维护页。"
            enabled={settings.isMaintenanceMode}
            action={toggleMaintenanceMode}
            icon={AlertTriangle}
            tone="amber"
            disabled={!canToggleMaintenance}
          />
          <FeatureFlagCard
            title="新用户注册通道"
            description="关闭后，注册 API 将返回 403，前台注册入口也会消失。"
            enabled={settings.registrationEnabled}
            action={toggleRegistrationEnabled}
            icon={UserPlus}
            disabled={!canManageAuthSettings}
          />
          <FeatureFlagCard
            title="OAuth 社交登录"
            description="关闭后，即使配置了 GitHub/Google，前台也不会显示社交登录按钮。"
            enabled={settings.oauthEnabled}
            action={toggleOauthEnabled}
            icon={LockKeyhole}
            disabled={!canManageAuthSettings}
          />
          <FeatureFlagCard
            title="强制管理员启用 2FA"
            description="开启后，后台管理员需要配置验证器 App 两步验证，才能继续访问受保护的后台区域。"
            enabled={settings.requireAdminTwoFactor}
            action={toggleRequireAdminTwoFactor}
            icon={ShieldCheck}
            disabled={!canManageAuthSettings}
          />
        </div>
      </section>

      <AdminTwoFactorCard
        initialEnabled={adminTwoFactor?.twoFactorEnabled === true}
        initialBackupCodes={getBackupCodeDisplay(
          adminTwoFactor?.twoFactorBackupCodes
        )}
      />

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/70">
            Where It Works
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
            这些配置会在哪里生效
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldImpact
            label="Site Title"
            effect="影响首页品牌标题、登录页品牌标题，以及默认 SEO 标题。"
          />
          <FieldImpact
            label="SEO Description"
            effect="影响首页副标题和搜索引擎摘要，适合写平台定位。"
          />
          <FieldImpact
            label="Support Email"
            effect="作为联系管理员链接的邮箱回退方案，也可显示在登录页底部。"
          />
          <FieldImpact
            label="联系管理员入口"
            effect="影响封禁页的联系按钮和登录页帮助入口，可配置为邮箱、Telegram、WhatsApp、QQ、微信客服页或其他 HTTPS 链接。"
          />
          <FieldImpact
            label="首页公告条"
            effect="开启后展示在首页 CTA 上方，可用于维护通知、Beta 邀请、版本公告。"
          />
          <FieldImpact
            label="GitHub Repository"
            effect="替换首页右上角和页脚的项目仓库链接。"
          />
          <FieldImpact
            label="Footer Copyright"
            effect="替换首页底部版权文字，适合品牌化部署。"
          />
        </div>
      </section>
    </div>
  );
}
