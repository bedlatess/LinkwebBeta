import { getGlobalSiteSettings } from "@/lib/site-settings";
import {
  Globe2,
  LockKeyhole,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  toggleOauthEnabled,
  toggleRegistrationEnabled,
  updateSiteBasics,
} from "./settings-actions";

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

function FeatureFlagCard({
  title,
  description,
  enabled,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  enabled: boolean;
  action: () => Promise<void>;
  icon: typeof UserPlus;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left shadow-2xl shadow-black/15 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.055]"
      >
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              enabled
                ? "border-emerald-300/20 bg-emerald-400/12 text-emerald-300"
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
              enabled ? "text-emerald-200" : "text-white/35"
            }`}
          >
            {enabled ? "已开启" : "已关闭"}
          </span>
          <SwitchVisual enabled={enabled} />
        </div>
      </button>
    </form>
  );
}

export default async function AdminSettingsPage() {
  const settings = await getGlobalSiteSettings();

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
              管理站点基础 SEO 信息，并用 Feature Flags 控制注册与社交登录入口。
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
          className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
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
                用于默认页面标题与搜索摘要。
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
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200"
            >
              <Save className="h-4 w-4" />
              保存基础设置
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <FeatureFlagCard
            title="新用户注册通道"
            description="关闭后，注册 API 将返回 403，前台注册入口也会消失。"
            enabled={settings.registrationEnabled}
            action={toggleRegistrationEnabled}
            icon={UserPlus}
          />
          <FeatureFlagCard
            title="OAuth 社交登录"
            description="关闭后，即使配置了 GitHub/Google，前台也不会显示社交登录按钮。"
            enabled={settings.oauthEnabled}
            action={toggleOauthEnabled}
            icon={LockKeyhole}
          />
        </div>
      </section>
    </div>
  );
}
