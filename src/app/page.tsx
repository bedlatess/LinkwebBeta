import Link from "next/link";
import { getGlobalSiteSettings } from "@/lib/site-settings";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Globe2,
  GripVertical,
  Layers3,
  Link2,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.72c-2.78.62-3.37-1.38-3.37-1.38-.45-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.75-4.57 5 .36.32.68.95.68 1.92v2.86c0 .28.18.6.69.5A10.23 10.23 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

const features = [
  {
    title: "拖拽排序",
    description: "像整理工作台一样管理链接顺序，失败自动回滚，前后端状态保持一致。",
    icon: GripVertical,
    tone: "text-cyan-200",
  },
  {
    title: "主题与高级 CSS",
    description: "字体、背景、按钮样式和自定义 CSS 全部开放给用户接管。",
    icon: Palette,
    tone: "text-emerald-200",
  },
  {
    title: "打赏变现",
    description: "PayPal、自定义赞助链接、加密货币地址，变现入口完全归你所有。",
    icon: CircleDollarSign,
    tone: "text-rose-200",
  },
  {
    title: "点击分析",
    description: "加盐哈希 IP、限流防刷、访问日志和趋势图，既看数据也守隐私。",
    icon: BarChart3,
    tone: "text-amber-200",
  },
  {
    title: "自定义域名",
    description: "支持绑定个人域名，让链接主页成为你的长期公开身份入口。",
    icon: Globe2,
    tone: "text-sky-200",
  },
  {
    title: "系统后台",
    description: "超级管理员、普通管理员、精细化权限、封禁和内容审查一体化。",
    icon: ShieldCheck,
    tone: "text-emerald-200",
  },
];

export default async function HomePage() {
  const settings = await getGlobalSiteSettings();
  const githubUrl =
    settings.githubUrl || "https://github.com/bedlatess/LinkwebBeta";
  const announcement =
    settings.announcementEnabled && settings.announcementText
      ? settings.announcementText
      : null;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative px-5 py-6 sm:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-x-0 top-0 h-28 border-b border-cyan-300/10 bg-cyan-300/[0.035]" />
        <div className="absolute inset-x-0 bottom-0 h-28 border-t border-emerald-300/10 bg-emerald-300/[0.025]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10">
                <Link2 className="h-4 w-4 text-cyan-100" />
              </span>
              <span className="text-sm font-semibold tracking-[0.28em] text-white/80">
                LINKWEB
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/test"
                className="hidden rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/58 transition hover:border-cyan-300/30 hover:text-cyan-100 sm:inline-flex"
              >
                演示主页
              </Link>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/58 transition hover:border-white/25 hover:text-white"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                项目仓库
              </a>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.04fr_0.96fr]">
            <div>
              {announcement && (
                <div className="mb-5 inline-flex max-w-2xl items-center gap-2 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-100/85">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  {announcement}
                </div>
              )}

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/75">
                <LockKeyhole className="h-3.5 w-3.5" />
                self-hosted link-in-bio infrastructure
              </div>

              <h1 className="max-w-6xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08] lg:text-6xl xl:text-7xl xl:leading-[1.05]">
                <span className="block">{settings.siteTitle}：自托管</span>
                <span className="mt-2 block md:mt-3">
                  数据自主的个人链接聚合中心
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
                {settings.seoDescription}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_40px_rgba(103,232,249,0.18)] transition hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  立即加入 / 去登录
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/test"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  <Layers3 className="h-4 w-4" />
                  查看演示
                </Link>
                <Link
                  href="/sys-admin/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-200 transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-emerald-400/15"
                >
                  <ShieldCheck className="h-4 w-4" />
                  进入后台
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/35 backdrop-blur-xl">
                <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
                      public profile preview
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl border border-cyan-300/20 bg-cyan-300/10" />
                      <div>
                        <p className="text-lg font-semibold tracking-tight">
                          Linkweb Demo
                        </p>
                        <p className="mt-1 text-sm text-white/40">
                          @test · 自托管身份入口
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {features.slice(0, 4).map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <div
                            key={feature.title}
                            className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                          >
                            <Icon className={`h-4 w-4 ${feature.tone}`} />
                            <span className="flex-1 text-sm font-medium text-white/72">
                              {feature.title}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-white/25" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      ["users", "权限"],
                      ["links", "审查"],
                      ["tips", "变现"],
                    ].map(([key, label]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                      >
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/25">
                          {key}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/75">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-3 pb-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <Icon className={`mb-4 h-5 w-5 ${feature.tone}`} />
                  <h2 className="text-sm font-semibold text-white/90">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </section>

          <footer className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <span>{settings.footerText}</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-white/55 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.08] hover:text-white"
            >
              <GitHubIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
              <span>项目仓库</span>
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
