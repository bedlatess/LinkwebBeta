import { ArrowLeft, Radar } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:38px_38px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.16),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.12),transparent_38%)]" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/10" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />

      <section className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-400/12 text-emerald-200 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
          <Radar className="h-8 w-8" />
        </div>

        <div className="relative inline-block">
          <h1 className="select-none text-[7rem] font-black leading-none tracking-tight text-white md:text-[11rem]">
            404
          </h1>
          <span className="absolute left-2 top-3 select-none text-[7rem] font-black leading-none tracking-tight text-cyan-300/35 blur-[1px] md:text-[11rem]">
            404
          </span>
          <span className="absolute -left-2 top-0 select-none text-[7rem] font-black leading-none tracking-tight text-red-400/25 md:text-[11rem]">
            404
          </span>
          <div className="absolute left-0 top-[42%] h-2 w-full bg-slate-950/80 shadow-[0_0_24px_rgba(16,185,129,0.35)]" />
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/75">
          SIGNAL LOST
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/58 md:text-lg">
          链接断开，你访问的区域不存在或已被管理员系统屏蔽
        </p>

        <div className="mt-9 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)] transition hover:-translate-y-0.5 hover:border-emerald-200/60 hover:bg-emerald-400/16 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回网站首页
          </Link>
        </div>
      </section>
    </main>
  );
}
