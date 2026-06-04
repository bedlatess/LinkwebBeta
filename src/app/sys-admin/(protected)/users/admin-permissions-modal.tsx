"use client";

import type { AdminPermissionField } from "@/lib/admin-action-auth";
import {
  DatabaseZap,
  Link2,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  updateAdminPermissions,
  type AdminPermissionInput,
} from "./user-actions";

type PermissionOption = {
  field: AdminPermissionField;
  label: string;
  description: string;
  highRisk?: boolean;
};

const permissionGroups: {
  title: string;
  description: string;
  icon: typeof UserCog;
  options: PermissionOption[];
}[] = [
  {
    title: "用户治理",
    description: "控制用户列表、封禁、资料编辑、密码重置和用户权益。",
    icon: UserCog,
    options: [
      {
        field: "permViewUsers",
        label: "查看用户列表",
        description: "允许进入用户管理页并查看基础账号信息。",
      },
      {
        field: "permBanUsers",
        label: "封禁 / 解封",
        description: "允许阻断用户登录和公开主页访问。",
      },
      {
        field: "permEditUsers",
        label: "编辑用户资料",
        description: "允许修改昵称、简介、打赏配置并进入用户资产面板。",
      },
      {
        field: "permResetUserPasswords",
        label: "重置用户密码",
        description: "允许为普通用户强制设置新密码。",
      },
      {
        field: "permManageUserEntitlements",
        label: "用户高级能力",
        description: "允许开关自定义 CSS、字体和打赏变现能力。",
      },
      {
        field: "permDeleteUsers",
        label: "物理删除用户",
        description: "彻底删除用户及其全部资产，无法恢复。",
        highRisk: true,
      },
    ],
  },
  {
    title: "内容审查",
    description: "控制全站链接池可见性与违规链接下架能力。",
    icon: Link2,
    options: [
      {
        field: "permViewLinks",
        label: "查看链接池",
        description: "允许进入内容审查页并搜索全站链接。",
      },
      {
        field: "permDeleteLinks",
        label: "删除 / 下架链接",
        description: "允许物理删除违规、钓鱼或无效链接。",
      },
    ],
  },
  {
    title: "站点配置",
    description: "控制公开站点展示和认证入口策略。",
    icon: Settings2,
    options: [
      {
        field: "permManageSiteSettings",
        label: "站点展示配置",
        description: "允许修改标题、SEO、公告、页脚和仓库链接。",
      },
      {
        field: "permManageAuthSettings",
        label: "认证入口配置",
        description: "允许开关新用户注册和 OAuth 社交登录。",
      },
    ],
  },
  {
    title: "系统运维",
    description: "控制清理任务和全局维护闸门。",
    icon: DatabaseZap,
    options: [
      {
        field: "permRunMaintenance",
        label: "执行数据清理",
        description: "允许清理过期会话、空链接等内部垃圾数据。",
      },
      {
        field: "permToggleMaintenance",
        label: "站点维护模式",
        description: "允许开启或关闭全站外部流量维护闸门。",
        highRisk: true,
      },
    ],
  },
];

const legacyFields: AdminPermissionField[] = [
  "permManageUsers",
  "permManageLinks",
  "permManageSettings",
];

interface AdminPermissionsModalProps {
  userId: string;
  label: string;
  initialPermissions: AdminPermissionInput;
}

export function AdminPermissionsModal({
  userId,
  label,
  initialPermissions,
}: AdminPermissionsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [permissions, setPermissions] =
    useState<AdminPermissionInput>(initialPermissions);

  const highRiskChanged = useMemo(
    () =>
      permissions.permDeleteUsers !== initialPermissions.permDeleteUsers ||
      permissions.permToggleMaintenance !==
        initialPermissions.permToggleMaintenance,
    [initialPermissions, permissions]
  );

  function setPermission(field: AdminPermissionField, value: boolean) {
    setPermissions((current) => ({ ...current, [field]: value }));
  }

  const resetAndClose = useCallback(() => {
    setPermissions(initialPermissions);
    setOpen(false);
  }, [initialPermissions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        resetAndClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, resetAndClose]);

  function handleSave() {
    if (highRiskChanged) {
      const ok = window.confirm(
        "警告：此操作涉及系统级高风险权限，确定要修改吗？"
      );

      if (!ok) {
        return;
      }
    }

    startTransition(async () => {
      try {
        await updateAdminPermissions(userId, permissions, highRiskChanged);
        setOpen(false);
      } finally {
        router.refresh();
      }
    });
  }

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="关闭权限面板"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`admin-permissions-${userId}`}
        className="relative z-10 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50"
      >
        <div className="shrink-0 border-b border-white/10 bg-white/[0.035] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
                Admin Permissions
              </p>
              <h2
                id={`admin-permissions-${userId}`}
                className="mt-2 text-xl font-semibold tracking-tight text-white"
              >
                {label}
              </h2>
              <p className="mt-2 text-sm text-white/45">
                按模块拆分普通管理员权限，危险操作会触发二次确认。
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭权限面板"
              onClick={resetAndClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {permissionGroups.map((group) => {
            const Icon = group.icon;

            return (
              <section
                key={group.title}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/85">
                      {group.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-white/42">
                      {group.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.options.map((item) => {
                    const enabled = permissions[item.field];

                    return (
                      <label
                        key={item.field}
                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                          item.highRisk
                            ? "border-red-400/18 bg-red-500/[0.045] hover:bg-red-500/[0.07]"
                            : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]"
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                              item.highRisk
                                ? "border-red-300/20 bg-red-400/12 text-red-200"
                                : "border-emerald-300/20 bg-emerald-400/12 text-emerald-200"
                            }`}
                          >
                            {item.highRisk ? (
                              <ShieldAlert className="h-4 w-4" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white/85">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-white/42">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(event) =>
                            setPermission(item.field, event.target.checked)
                          }
                          className="sr-only"
                        />
                        <span
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
                            enabled
                              ? item.highRisk
                                ? "border-red-300/30 bg-red-400/45"
                                : "border-emerald-300/30 bg-emerald-400/45"
                              : "border-white/10 bg-white/10"
                          }`}
                        >
                          <span
                            className={`h-4.5 w-4.5 rounded-full bg-white shadow-lg transition ${
                              enabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {legacyFields.map((field) => (
            <input
              key={field}
              type="hidden"
              value={String(permissions[field])}
              readOnly
            />
          ))}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-white/10 bg-white/[0.025] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "保存中..." : "保存权限"}
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 text-xs font-medium leading-none text-amber-100 transition hover:border-amber-300/35 hover:bg-amber-400/15"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        编辑权限
      </button>

      {open ? createPortal(modal, document.body) : null}
    </>
  );
}
