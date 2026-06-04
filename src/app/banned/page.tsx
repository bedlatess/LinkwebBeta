import { getGlobalSiteSettings } from "@/lib/site-settings";
import { Ban, Home, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function BannedPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const isIpBan = type === "ip";
  const settings = await getGlobalSiteSettings();
  const contactHref =
    settings.adminContactUrl ||
    (settings.supportEmail ? `mailto:${settings.supportEmail}` : null) ||
    "mailto:admin@pawn.eu.org";
  const contactLabel = settings.adminContactLabel || "联系管理员";
  const opensNewTab =
    contactHref.startsWith("http://") || contactHref.startsWith("https://");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-16 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(248,113,113,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(248,113,113,0.07)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-x-0 top-0 h-24 border-b border-red-300/10 bg-red-500/[0.035]" />
      <div className="absolute inset-x-0 bottom-0 h-24 border-t border-amber-300/10 bg-amber-400/[0.025]" />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-red-300/20 bg-white/[0.035] shadow-2xl shadow-red-950/30 backdrop-blur-xl">
        <div className="border-b border-red-300/15 bg-red-500/[0.045] px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/25 bg-red-500/15 text-red-200">
              {isIpBan ? (
                <ShieldAlert className="h-7 w-7" />
              ) : (
                <Ban className="h-7 w-7" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-200/65">
                Access Suspended
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                访问已被系统限制
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-7 py-7">
          <p className="text-sm leading-7 text-white/58">
            {isIpBan
              ? "当前网络地址触发了平台安全策略，访问已被临时或永久阻断。若你认为这是误判，请联系站点管理员处理。"
              : "当前账号已被系统管理员封禁，登录、控制台和公开主页访问均已暂停。"}
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/32">
              Reference
            </p>
            <p className="mt-2 font-mono text-sm text-red-100/80">
              {isIpBan ? "IP_POLICY_DENIED" : "ACCOUNT_SUSPENDED"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
            >
              <Home className="h-4 w-4" />
              返回首页
            </Link>
            <a
              href={contactHref}
              target={opensNewTab ? "_blank" : undefined}
              rel={opensNewTab ? "noopener noreferrer" : undefined}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Mail className="h-4 w-4" />
              {contactLabel}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
