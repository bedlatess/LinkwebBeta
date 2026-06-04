import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

/**
 * Analytics Dashboard — Server Component
 *
 * Passes the session to the client for API fetching.
 * Authentication enforced by proxy.ts.
 */
export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
          Traffic Intelligence
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          数据分析
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
          过去 7 天的链接访问数据概览
        </p>
      </section>

      <AnalyticsClient />
    </div>
  );
}
