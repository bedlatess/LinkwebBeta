"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ExternalLink,
  Link2,
  LogOut,
  Menu,
  Palette,
  Settings,
  User,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/links", label: "链接", icon: Link2 },
  { href: "/dashboard/appearance", label: "外观", icon: Palette },
  { href: "/dashboard/analytics", label: "分析", icon: BarChart3 },
  { href: "/dashboard/settings", label: "账号", icon: Settings },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  userImage?: string | null;
}

export function Sidebar({ userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div
      className={`flex h-full flex-col border-r border-white/10 bg-slate-950/72 shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all duration-300 ${
        collapsed ? "w-[76px]" : "w-72"
      }`}
    >
      <div className="flex h-18 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/dashboard/links"
          className={`flex min-w-0 items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
            <Link2 className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span>
              <span className="block text-sm font-semibold tracking-[0.24em] text-white/80">
                LINKWEB
              </span>
              <span className="mt-0.5 block text-[11px] text-white/35">
                Creator Console
              </span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-xl border border-white/10 bg-white/[0.035] p-2 text-white/35 transition hover:bg-white/[0.07] hover:text-white/70 lg:block"
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(103,232,249,0.08)]"
                  : "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.04] hover:text-white/75"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={`rounded-2xl border border-white/10 bg-white/[0.035] p-3 ${
            collapsed ? "flex justify-center" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            {userImage ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="h-4 w-4 text-white/35" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={userImage}
                  alt=""
                  className="relative h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.display = "block";
                  }}
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <User className="h-4 w-4 text-white/35" />
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white/82">
                  {userName}
                </p>
                <p className="truncate text-xs text-white/32">
                  {maskEmail(userEmail)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2.5 text-sm text-white/42 transition hover:bg-white/[0.06] hover:text-white/75 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "返回首页" : undefined}
          >
            <ExternalLink className="h-4 w-4" />
            {!collapsed && <span>返回首页</span>}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className={`flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-white/38 transition hover:border-red-400/15 hover:bg-red-500/10 hover:text-red-200 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "退出登录" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-white/70 shadow-2xl shadow-black/30 backdrop-blur-xl lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭侧边栏"
          />
          <div className="absolute inset-y-0 left-0">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute -right-12 top-4 rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-white/70 backdrop-blur-xl"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden lg:block">{sidebarContent}</aside>
    </>
  );
}

function maskEmail(email: string) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0) return email;
  return `${email.slice(0, 3)}***${email.slice(atIndex)}`;
}
