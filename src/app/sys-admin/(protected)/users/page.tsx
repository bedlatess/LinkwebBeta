import { prisma } from "@/lib/prisma";
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { toggleUserBan, toggleUserPermission } from "./user-actions";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function getOrigin() {
  const url = process.env.NEXTAUTH_URL ?? "http://localhost:2222";
  return url.replace(/\/$/, "");
}

function TogglePill({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex min-w-28 items-center justify-between gap-2 rounded-full border px-2.5 py-1 text-xs transition ${
        enabled
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.04] text-white/35"
      }`}
    >
      {label}
      <span
        className={`h-3.5 w-3.5 rounded-full ${
          enabled ? "bg-emerald-300" : "bg-white/20"
        }`}
      />
    </span>
  );
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      customDomain: true,
      isBanned: true,
      bannedAt: true,
      allowCustomCSS: true,
      allowCustomFont: true,
      allowTips: true,
      createdAt: true,
    },
  });
  const origin = getOrigin();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/70">
              User Governance
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              用户高危管理
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              封禁会立刻阻断登录与公开主页访问；高级权限开关会影响用户外观自定义和打赏能力。
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/55">
            共 {users.length} 个用户
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.035] text-xs uppercase tracking-[0.18em] text-white/38">
                <th className="px-5 py-4 font-medium">用户</th>
                <th className="px-5 py-4 font-medium">专属链接</th>
                <th className="px-5 py-4 font-medium">注册时间</th>
                <th className="px-5 py-4 font-medium">状态</th>
                <th className="px-5 py-4 font-medium">高级权限</th>
                <th className="px-5 py-4 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {users.map((user) => {
                const displayName =
                  user.name ?? user.username ?? user.email ?? "未命名用户";
                const publicUrl = user.customDomain
                  ? `https://${user.customDomain}`
                  : user.username
                  ? `${origin}/${user.username}`
                  : null;

                return (
                  <tr
                    key={user.id}
                    className="bg-white/[0.01] transition hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt=""
                            className="h-10 w-10 rounded-full border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/35">
                            <UserRound className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/85">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-white/38">
                            {user.email ?? "未绑定邮箱"}
                          </p>
                          <p className="mt-0.5 text-xs text-white/25">
                            @{user.username ?? "unset"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {publicUrl ? (
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-64 items-center gap-1.5 truncate rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs text-cyan-200/80 transition hover:border-cyan-300/25 hover:bg-cyan-400/10 hover:text-cyan-100"
                        >
                          <span className="truncate">
                            {user.customDomain ?? `/${user.username}`}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-white/25">未设置</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-white/50">
                      {dateFormatter.format(user.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      {user.isBanned ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-200">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            已封禁
                          </span>
                          {user.bannedAt && (
                            <p className="text-xs text-white/28">
                              {dateFormatter.format(user.bannedAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          正常
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserPermission(
                              user.id,
                              "allowCustomCSS"
                            );
                          }}
                        >
                          <button type="submit">
                            <TogglePill
                              enabled={user.allowCustomCSS}
                              label="CSS"
                            />
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserPermission(
                              user.id,
                              "allowCustomFont"
                            );
                          }}
                        >
                          <button type="submit">
                            <TogglePill
                              enabled={user.allowCustomFont}
                              label="字体"
                            />
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserPermission(user.id, "allowTips");
                          }}
                        >
                          <button type="submit">
                            <TogglePill
                              enabled={user.allowTips}
                              label="打赏"
                            />
                          </button>
                        </form>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserBan(user.id);
                          }}
                        >
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                              user.isBanned
                                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                                : "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                            }`}
                          >
                            <Ban className="h-4 w-4" />
                            {user.isBanned ? "解封" : "封禁"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35">
              <FileCode2 className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-white/55">暂无用户数据</p>
            <p className="mt-1 text-xs text-white/30">
              新用户注册后会自动出现在这里。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
