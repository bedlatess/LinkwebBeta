import { ServerCog, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-amber-400/12 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[340px] w-[340px] rounded-full bg-cyan-400/10 blur-[120px]" />

      <section className="relative z-10 w-full max-w-2xl rounded-2xl border border-amber-300/20 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/12 text-amber-200 shadow-lg shadow-amber-500/10">
          <ServerCog className="h-8 w-8" />
        </div>

        <p className="text-xs font-medium uppercase tracking-[0.28em] text-amber-200/70">
          System Under Maintenance
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
          系统停机升级中
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 md:text-base">
          LinkWeb 正在进行维护、升级或安全巡检。普通访问暂时关闭，管理员后台仍保持可用。
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/45">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          服务恢复后页面会自动恢复访问
        </div>
      </section>
    </main>
  );
}
