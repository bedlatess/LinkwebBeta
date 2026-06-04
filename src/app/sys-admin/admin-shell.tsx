"use client";

import type { AdminActor } from "@/lib/admin-action-auth";
import {
  AlertTriangle,
  BarChart3,
  LogOut,
  Menu,
  ServerCog,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AdminShellProps {
  actor: AdminActor;
  adminEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ actor, adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { href: "/sys-admin", label: "仪表盘", icon: BarChart3, visible: true },
    {
      href: "/sys-admin/users",
      label: "用户管理",
      icon: Users,
      visible: actor.permissions.permManageUsers,
    },
    {
      href: "/sys-admin/links",
      label: "内容审查",
      icon: AlertTriangle,
      visible: actor.permissions.permManageLinks,
    },
    {
      href: "/sys-admin/settings",
      label: "全局设置",
      icon: Settings,
      visible: actor.permissions.permManageSettings,
    },
    {
      href: "/sys-admin/maintenance",
      label: "数据清理",
      icon: Wrench,
      visible: actor.permissions.permManageUsers,
    },
  ].filter((item) => item.visible);

  async function handleLogout() {
    setSigningOut(true);

    try {
      if (actor.type === "SUPER_ADMIN") {
        await fetch("/sys-admin/api/logout", { method: "POST" });
      }
    } finally {
      const nextPath =
        actor.type === "SUPER_ADMIN"
          ? "/sys-admin/login"
          : "/api/auth/signout?callbackUrl=/auth/signin";
      router.push(nextPath);
      router.refresh();
    }
  }

  const sidebar = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/15 text-emerald-300 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">LinkWeb Admin</p>
          <p className="text-xs text-white/35">Control Plane</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/sys-admin" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-lg shadow-emerald-950/20"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/85"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs text-white/35">当前管理员</p>
          <p className="mt-1 truncate text-sm font-medium text-white/80">
            {adminEmail}
          </p>
          <p className="mt-1 text-xs text-emerald-200/55">
            {actor.type === "SUPER_ADMIN" ? "Super Admin" : "Normal Admin"}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none fixed -left-24 top-12 h-72 w-72 rounded-full bg-emerald-400/10 blur-[110px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-[120px]" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.025] backdrop-blur-xl lg:flex lg:flex-col">
          {sidebar}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="关闭导航"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-72 flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-xl">
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/85 px-4 backdrop-blur-xl lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="打开导航"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] lg:hidden"
              >
                {mobileOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <ServerCog className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  系统管理后台
                </p>
                <p className="text-xs text-white/35">{adminEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "退出中" : "退出登录"}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
