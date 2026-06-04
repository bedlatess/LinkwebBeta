import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  ExternalLink,
  HeartHandshake,
  KeyRound,
  Link2,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  resetManagedUserPassword,
  updateManagedUser,
} from "./user-edit-actions";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function ManagedUserEditPage({ params }: Props) {
  const actor = await getAdminActor();

  if (!actor?.permissions.permEditUsers) {
    notFound();
  }

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      themeConfig: true,
      _count: {
        select: {
          links: true,
          accounts: true,
          sessions: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = user.name ?? user.username ?? user.email ?? "未命名用户";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <Link
          href="/sys-admin/users"
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          返回用户管理
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/70">
              User Editor
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {displayName}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              {user.email ?? "未绑定邮箱"} · @{user.username ?? "unset"}
            </p>
          </div>
          <Link
            href={`/sys-admin/users/${user.id}/links`}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-400/15"
          >
            <Link2 className="h-4 w-4" />
            查看链接资产
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={updateManagedUser.bind(null, user.id)}
          className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12 text-emerald-300">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/85">
                核心资料编辑
              </h2>
              <p className="text-sm text-white/38">
                编辑用户公开身份、简介和赞助配置。
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-medium text-white/50"
              >
                昵称 / 展示名
              </label>
              <input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="mb-1.5 block text-xs font-medium text-white/50"
              >
                个人简介
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={user.bio ?? ""}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
              />
            </div>

            <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.04] p-4">
              <div className="mb-4 flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-amber-200" />
                <p className="text-sm font-semibold text-amber-100">
                  打赏配置
                </p>
              </div>

              <label className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                启用打赏入口
                <input
                  type="checkbox"
                  name="tipEnabled"
                  defaultChecked={user.themeConfig?.tipEnabled ?? false}
                  className="h-4 w-4 accent-amber-300"
                />
              </label>

              <div className="grid gap-3">
                <input
                  name="paypalEmail"
                  defaultValue={user.themeConfig?.paypalEmail ?? ""}
                  placeholder="PayPal 邮箱"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-300/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-300/10"
                />
                <input
                  name="customTipUrl"
                  defaultValue={user.themeConfig?.customTipUrl ?? ""}
                  placeholder="自定义赞助链接"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-300/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-300/10"
                />
                <input
                  name="cryptoAddress"
                  defaultValue={user.themeConfig?.cryptoAddress ?? ""}
                  placeholder="加密货币收款地址"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-300/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-300/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-200"
            >
              <Save className="h-4 w-4" />
              保存编辑资料
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white/85">
                  资产概览
                </h2>
                <p className="text-sm text-white/38">该用户当前资源占用。</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/35">链接</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {user._count.links}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/35">登录会话</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {user._count.sessions}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/35">OAuth 绑定</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {user._count.accounts}
                </p>
              </div>
            </div>
          </section>

          {actor.permissions.permResetUserPasswords && (
            <form
              action={resetManagedUserPassword.bind(null, user.id)}
              className="rounded-2xl border border-red-400/20 bg-red-500/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-300/20 bg-red-400/12 text-red-200">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-red-100">
                    强制重置密码
                  </h2>
                  <p className="text-sm text-red-100/45">
                    会覆盖用户原密码，至少 12 个字符。
                  </p>
                </div>
              </div>
              <input
                name="password"
                type="password"
                minLength={12}
                required
                placeholder="输入新密码"
                className="w-full rounded-xl border border-red-300/20 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-red-300/50 focus:ring-2 focus:ring-red-300/10"
              />
              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
              >
                <KeyRound className="h-4 w-4" />
                确认重置密码
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
