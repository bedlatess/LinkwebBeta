import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Coins,
  GitBranch,
  GripVertical,
  Globe2,
  Link2,
  Palette,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const GITHUB_URL = "https://github.com/bedlatess/LinkwebBeta";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.72c-2.78.62-3.37-1.38-3.37-1.38-.45-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.75-4.57 5 .36.32.68.95.68 1.92v2.86c0 .28.18.6.69.5A10.23 10.23 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

const features = [
  {
    title: "拖拽排序",
    description: "用 dnd-kit 管理链接顺序，后台保存后公开页实时同步。",
    icon: GripVertical,
  },
  {
    title: "多主题切换",
    description: "毛玻璃、极简暗黑、赛博朋克和自定义 CSS 都能接管主页视觉。",
    icon: Palette,
  },
  {
    title: "去中心化打赏",
    description: "支持 PayPal、自定义赞助链接和加密货币地址，赞助入口由你掌控。",
    icon: Coins,
  },
  {
    title: "点击分析统计",
    description: "隐私优先的访问日志，按 7 天趋势和热门链接看见真实流量。",
    icon: BarChart3,
  },
  {
    title: "自定义域名",
    description: "绑定自己的域名，把个人链接中心变成真正属于你的入口。",
    icon: Globe2,
  },
  {
    title: "数据自主",
    description: "自托管部署、SQLite 起步、Docker 运行，数据不用交给第三方平台。",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#06070a] text-white">
      <section className="relative min-h-screen px-5 py-6 sm:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.24),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(244,63,94,0.2),transparent_30%)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-300/30 bg-teal-300/10">
                <Link2 className="h-4 w-4 text-teal-200" />
              </span>
              <span className="text-sm font-semibold tracking-[0.28em] text-white/80">
                LINKWEB
              </span>
            </Link>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white sm:inline-flex"
            >
              <GitBranch className="h-3.5 w-3.5" />
              GitHub
            </a>
          </header>

          <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/[0.06] px-3 py-1.5 text-xs font-medium text-teal-100/80">
                <Terminal className="h-3.5 w-3.5" />
                self-hosted link-in-bio control plane
              </div>

              <h1 className="max-w-6xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08] lg:text-6xl xl:text-7xl xl:leading-[1.05]">
                <span className="block">LinkWeb：自托管</span>
                <span className="mt-2 block md:mt-3">
                  数据自主的个人链接聚合中心
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
                把主页链接、主题皮肤、点击分析、赞助入口和自定义域名收进一个你能完全掌控的开源系统。
                不租借流量入口，不交出数据主权。
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_40px_rgba(45,212,191,0.25)] transition-transform hover:-translate-y-0.5"
                >
                  立即加入 / 去登录
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-200 shadow-[0_0_36px_rgba(52,211,153,0.12)] transition-all hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-emerald-400/15 hover:text-emerald-100"
                >
                  <ShieldCheck className="h-4 w-4" />
                  进入后台
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
                    public.profile
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-white/55">
                  <p>
                    <span className="text-teal-300">$</span> deploy linkweb
                    --owner pawn
                  </p>
                  <p className="text-white/30">
                    sync links · theme · analytics · tips · domain
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  {features.slice(0, 4).map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] p-4"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                          <Icon className="h-4 w-4 text-teal-200" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white/86">
                            {feature.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/42">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-sm"
                >
                  <Icon className="mb-4 h-5 w-5 text-teal-200" />
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
            <span>© 2026 PAWN. All rights reserved.</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white/55 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300/30 hover:bg-teal-300/[0.08] hover:text-white"
            >
              <GitHubMark className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
              <span>项目仓库</span>
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
