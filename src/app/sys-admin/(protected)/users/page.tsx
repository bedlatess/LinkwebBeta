import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  Ban,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileCode2,
  Link2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPermissionsModal } from "./admin-permissions-modal";
import { CreateUserModal } from "./create-user-modal";
import { DeleteUserButton } from "./delete-user-button";
import {
  deleteUser,
  toggleAdminRole,
  toggleUserBan,
  toggleUserPermission,
} from "./user-actions";

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

function CapabilityPill({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
        enabled
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.04] text-white/35"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          enabled ? "bg-emerald-300" : "bg-white/20"
        }`}
      />
      {label}
    </span>
  );
}

function CapabilityToggle({
  userId,
  field,
  enabled,
  label,
}: {
  userId: string;
  field: "allowCustomCSS" | "allowCustomFont" | "allowTips";
  enabled: boolean;
  label: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await toggleUserPermission(userId, field);
      }}
    >
      <button type="submit">
        <CapabilityPill enabled={enabled} label={label} />
      </button>
    </form>
  );
}

export default async function AdminUsersPage() {
  const actor = await getAdminActor();

  if (!actor?.permissions.permViewUsers) {
    redirect(
      `/sys-admin?toast=${encodeURIComponent("当前管理员没有用户管理权限")}`
    );
  }

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
      role: true,
      permManageUsers: true,
      permDeleteUsers: true,
      permManageLinks: true,
      permManageSettings: true,
      permToggleMaintenance: true,
      permViewUsers: true,
      permBanUsers: true,
      permEditUsers: true,
      permResetUserPasswords: true,
      permManageUserEntitlements: true,
      permViewLinks: true,
      permDeleteLinks: true,
      permManageSiteSettings: true,
      permManageAuthSettings: true,
      permRunMaintenance: true,
      createdAt: true,
      _count: {
        select: {
          links: true,
          sessions: true,
        },
      },
    },
  });

  const origin = getOrigin();
  const isSuperAdmin = actor.type === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/70">
              User Governance
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              用户管理
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              按用户资产卡片集中处理封禁、编辑、权限、权益和高危删除操作。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {isSuperAdmin && <CreateUserModal />}
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="px-3 py-2">
                <p className="text-xs text-white/35">用户</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {users.length}
                </p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-white/35">管理员</p>
                <p className="mt-1 text-lg font-semibold text-amber-100">
                  {users.filter((user) => user.role === "ADMIN").length}
                </p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-white/35">封禁</p>
                <p className="mt-1 text-lg font-semibold text-red-100">
                  {users.filter((user) => user.isBanned).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {users.length > 0 ? (
        <section className="grid gap-4">
          {users.map((user) => {
            const displayName =
              user.name ?? user.username ?? user.email ?? "未命名用户";
            const publicUrl = user.customDomain
              ? `https://${user.customDomain}`
              : user.username
              ? `${origin}/${user.username}`
              : null;

            return (
              <article
                key={user.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:border-white/16 hover:bg-white/[0.045]"
              >
                <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.7fr)]">
                  <div className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt=""
                            className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/35">
                            <UserRound className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold text-white/88">
                              {displayName}
                            </h2>
                            {user.role === "ADMIN" && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100">
                                <ShieldCheck className="h-3 w-3" />
                                ADMIN
                              </span>
                            )}
                            {user.isBanned ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-200">
                                <ShieldAlert className="h-3 w-3" />
                                已封禁
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
                                <CheckCircle2 className="h-3 w-3" />
                                正常
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-sm text-white/42">
                            {user.email ?? "未绑定邮箱"}
                          </p>
                          <p className="mt-1 text-xs text-white/28">
                            @{user.username ?? "unset"} · 注册于{" "}
                            {dateFormatter.format(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      {publicUrl && (
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100/80 transition hover:border-cyan-300/35 hover:bg-cyan-400/15"
                        >
                          <span className="truncate">
                            {user.customDomain ?? `/${user.username}`}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <p className="text-xs text-white/35">链接资产</p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {user._count.links}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <p className="text-xs text-white/35">会话</p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {user._count.sessions}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <p className="text-xs text-white/35">封禁时间</p>
                        <p className="mt-2 truncate text-sm font-medium text-white/70">
                          {user.bannedAt
                            ? dateFormatter.format(user.bannedAt)
                            : "无"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {actor.permissions.permManageUserEntitlements ? (
                        <>
                          <CapabilityToggle
                            userId={user.id}
                            field="allowCustomCSS"
                            enabled={user.allowCustomCSS}
                            label="CSS"
                          />
                          <CapabilityToggle
                            userId={user.id}
                            field="allowCustomFont"
                            enabled={user.allowCustomFont}
                            label="字体"
                          />
                          <CapabilityToggle
                            userId={user.id}
                            field="allowTips"
                            enabled={user.allowTips}
                            label="打赏"
                          />
                        </>
                      ) : (
                        <>
                          <CapabilityPill
                            enabled={user.allowCustomCSS}
                            label="CSS"
                          />
                          <CapabilityPill
                            enabled={user.allowCustomFont}
                            label="字体"
                          />
                          <CapabilityPill
                            enabled={user.allowTips}
                            label="打赏"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-white/[0.02] p-5 xl:border-l xl:border-t-0">
                    <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/35">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-200/60" />
                      操作面板
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {isSuperAdmin && (
                        <>
                          <form
                            action={async () => {
                              "use server";
                              await toggleAdminRole(user.id);
                            }}
                          >
                            <button
                              type="submit"
                              className={`inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm leading-none transition ${
                                user.role === "ADMIN"
                                  ? "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]"
                                  : "border-amber-300/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15"
                              }`}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              {user.role === "ADMIN"
                                ? "撤销管理员"
                                : "设为管理员"}
                            </button>
                          </form>
                          {user.role === "ADMIN" && (
                            <AdminPermissionsModal
                              userId={user.id}
                              label={displayName}
                              initialPermissions={{
                                permManageUsers: user.permManageUsers,
                                permDeleteUsers: user.permDeleteUsers,
                                permManageLinks: user.permManageLinks,
                                permManageSettings: user.permManageSettings,
                                permToggleMaintenance:
                                  user.permToggleMaintenance,
                                permViewUsers: user.permViewUsers,
                                permBanUsers: user.permBanUsers,
                                permEditUsers: user.permEditUsers,
                                permResetUserPasswords:
                                  user.permResetUserPasswords,
                                permManageUserEntitlements:
                                  user.permManageUserEntitlements,
                                permViewLinks: user.permViewLinks,
                                permDeleteLinks: user.permDeleteLinks,
                                permManageSiteSettings:
                                  user.permManageSiteSettings,
                                permManageAuthSettings:
                                  user.permManageAuthSettings,
                                permRunMaintenance: user.permRunMaintenance,
                              }}
                            />
                          )}
                        </>
                      )}

                      {actor.permissions.permEditUsers && (
                        <Link
                          href={`/sys-admin/users/${user.id}/edit`}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-sm leading-none text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-400/15"
                        >
                          <Edit3 className="h-4 w-4" />
                          编辑
                        </Link>
                      )}

                      {actor.permissions.permEditUsers && (
                        <Link
                          href={`/sys-admin/users/${user.id}/links`}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm leading-none text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          <Link2 className="h-4 w-4" />
                          链接资产
                        </Link>
                      )}

                      {actor.permissions.permBanUsers && (
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserBan(user.id);
                          }}
                        >
                          <button
                            type="submit"
                            className={`inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm leading-none transition ${
                              user.isBanned
                                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                                : "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                            }`}
                          >
                            <Ban className="h-4 w-4" />
                            {user.isBanned ? "解封" : "封禁"}
                          </button>
                        </form>
                      )}

                      {actor.permissions.permDeleteUsers && (
                        <form
                          action={async () => {
                            "use server";
                            await deleteUser(user.id);
                          }}
                        >
                          <DeleteUserButton label={displayName} />
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35">
            <FileCode2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-white/55">暂无用户数据</p>
          <p className="mt-1 text-xs text-white/30">
            新用户注册后会自动出现在这里。
          </p>
        </section>
      )}
    </div>
  );
}
