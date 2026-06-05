import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TwoFactorChallengeForm } from "./two-factor-challenge-form";

export const dynamic = "force-dynamic";

export default async function TwoFactorPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.045] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/70">
            LinkWeb Security
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            确认本次登录
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/45">
            请输入验证器 App 中的 6 位动态码，也可以使用一次性恢复码继续。
          </p>
        </div>

        <Suspense fallback={<div className="h-32 rounded-xl bg-white/[0.04]" />}>
          <TwoFactorChallengeForm />
        </Suspense>
      </section>
    </main>
  );
}
