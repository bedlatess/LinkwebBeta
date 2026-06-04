"use client";

import type { AdminPermissionField } from "@/lib/admin-action-auth";
import { ShieldAlert, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  updateAdminPermissions,
  type AdminPermissionInput,
} from "./user-actions";

const permissionOptions: {
  field: AdminPermissionField;
  label: string;
  description: string;
  highRisk?: boolean;
}[] = [
  {
    field: "permManageUsers",
    label: "用户管理",
    description: "封禁、解封、代管用户资料与用户高级能力。",
  },
  {
    field: "permDeleteUsers",
    label: "物理删除用户",
    description: "彻底删除用户及其全部资产，无法恢复。",
    highRisk: true,
  },
  {
    field: "permManageLinks",
    label: "内容审查",
    description: "查看全站链接池并下架违规链接。",
  },
  {
    field: "permManageSettings",
    label: "全局设置",
    description: "修改站点标题、SEO、注册和 OAuth 策略。",
  },
  {
    field: "permToggleMaintenance",
    label: "维护模式",
    description: "开启或关闭全站外部流量维护闸门。",
    highRisk: true,
  },
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

  function resetAndClose() {
    setPermissions(initialPermissions);
    setOpen(false);
  }

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100 transition hover:border-amber-300/35 hover:bg-amber-400/15"
      >
        <SlidersHorizontal className="h-4 w-4" />
        编辑权限
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="关闭权限面板"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={resetAndClose}
          />

          <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 bg-white/[0.035] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
                    Admin Permissions
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                    {label}
                  </h2>
                  <p className="mt-2 text-sm text-white/45">
                    精细控制普通管理员可进入的模块与可执行的高危动作。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 p-6">
              {permissionOptions.map((item) => {
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

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-white/[0.025] px-6 py-5 sm:flex-row sm:justify-end">
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
                {pending ? "保存中" : "保存权限"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
