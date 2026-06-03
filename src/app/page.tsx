import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Coins,
  ExternalLink,
  GitBranch,
  GripVertical,
  Globe2,
  Link2,
  Palette,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const GITHUB_URL = "https://github.com/bedlatess/LinkwebBeta";

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

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">
                LinkWeb：自托管、数据自主的个人链接聚合中心
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
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
                >
                  查看源码
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
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
                    --owner you
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
            <span>Open-source self-hosted link infrastructure.</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/55 transition-colors hover:text-white"
            >
              github.com/bedlatess/LinkwebBeta
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
