import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { AdminLoginForm } from "./admin-login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-cyan-400/10 blur-[110px]" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/15 text-emerald-300 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            LinkWeb System Admin
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />
          }
        >
          <AdminLoginForm turnstileSiteKey={turnstileSiteKey} />
        </Suspense>
      </section>
    </main>
  );
}
