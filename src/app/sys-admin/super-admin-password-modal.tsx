"use client";

import { KeyRound, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { changeSuperAdminPassword } from "./super-admin-actions";

export function SuperAdminPasswordModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => {
    setError("");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  function handleSubmit(formData: FormData) {
    setError("");

    startTransition(async () => {
      try {
        await changeSuperAdminPassword(formData);
        router.push("/sys-admin/login");
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "修改密码失败。");
      }
    });
  }

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="关闭修改密码窗口"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="super-admin-password-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50"
      >
        <div className="border-b border-white/10 bg-white/[0.035] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/70">
                Super Admin
              </p>
              <h2
                id="super-admin-password-title"
                className="mt-2 text-xl font-semibold tracking-tight text-white"
              >
                修改超级管理员密码
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/45">
                修改成功后当前后台会话会立即失效，需要重新登录。
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭修改密码窗口"
              onClick={close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-xs font-medium text-white/50"
            >
              当前密码
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-xs font-medium text-white/50"
            >
              新密码
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-xs font-medium text-white/50"
            >
              确认新密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {pending ? "修改中..." : "确认修改"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15"
      >
        <KeyRound className="h-3.5 w-3.5" />
        修改超管密码
      </button>

      {open ? createPortal(modal, document.body) : null}
    </>
  );
}
