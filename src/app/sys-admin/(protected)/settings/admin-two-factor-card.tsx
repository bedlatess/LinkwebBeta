"use client";

import { Check, Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

type SetupData = {
  qrCodeDataUrl?: string;
  manualSecret?: string;
  error?: string;
};

function message(code: unknown) {
  if (code === "INVALID_TWO_FACTOR_CODE") return "验证码无效，请重试。";
  if (code === "INVALID_RECOVERY_CODE") return "恢复码无效或已经使用。";
  if (code === "TWO_FACTOR_SETUP_EXPIRED") return "设置会话已过期，请重新开始。";
  if (code === "TWO_FACTOR_ALREADY_ENABLED") return "两步验证已经启用。";
  return "两步验证操作失败。";
}

export function AdminTwoFactorCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  async function startSetup() {
    setLoading(true);
    setError("");
    setNotice("");
    setBackupCodes([]);

    try {
      const response = await fetch("/sys-admin/api/2fa/setup", {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as SetupData | null;

      if (!response.ok) throw new Error(message(data?.error));
      setQrCodeDataUrl(data?.qrCodeDataUrl ?? "");
      setManualSecret(data?.manualSecret ?? "");
    } catch (error) {
      setError(error instanceof Error ? error.message : "两步验证设置失败。");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/sys-admin/api/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) throw new Error(message(data?.error));
      setEnabled(true);
      setQrCodeDataUrl("");
      setManualSecret("");
      setCode("");
      setBackupCodes(data?.backupCodes ?? []);
      setNotice("后台账号两步验证已启用。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "两步验证确认失败。");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/sys-admin/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode: "totp" }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) throw new Error(message(data?.error));
      setEnabled(false);
      setCode("");
      setBackupCodes([]);
      setNotice("后台账号两步验证已关闭。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "两步验证关闭失败。");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateBackupCodes() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/sys-admin/api/2fa/backup-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) throw new Error(message(data?.error));
      setBackupCodes(data?.backupCodes ?? []);
      setCode("");
      setNotice("新的恢复码已生成。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "恢复码生成失败。");
    } finally {
      setLoading(false);
    }
  }

  async function copyCodes() {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setNotice("恢复码已复制。");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white/85">
            后台账号两步验证
          </h2>
          <p className="text-sm text-white/38">
            使用验证器 App 扫码启用。不会使用邮件或短信验证码。
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80">
              当前状态：{enabled ? "已启用" : "未启用"}
            </p>
            <p className="mt-1 text-sm leading-6 text-white/42">
              适用于当前后台身份，包括超级管理员或被提权的普通管理员。
            </p>
          </div>
          {!enabled && !qrCodeDataUrl && (
            <button
              type="button"
              onClick={startSetup}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              启用 2FA
            </button>
          )}
        </div>
      </div>

      {qrCodeDataUrl && !enabled && (
        <div className="mt-4 grid gap-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.035] p-4 lg:grid-cols-[auto_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeDataUrl}
            alt="Admin two-factor QR-Code"
            className="h-44 w-44 rounded-2xl bg-white p-3"
          />
          <div className="space-y-3">
            <p className="text-sm leading-6 text-white/50">
              扫码后输入验证器 App 中显示的 6 位验证码。无法扫码时可手动输入：
            </p>
            <code className="block break-all rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-emerald-100">
              {manualSecret}
            </code>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                placeholder="123456"
                className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
              <button
                type="button"
                onClick={confirmSetup}
                disabled={loading || !code.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                确认启用
              </button>
            </div>
          </div>
        </div>
      )}

      {enabled && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50">
            <KeyRound className="h-3.5 w-3.5" />
            当前 6 位验证码
          </label>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              placeholder="123456"
              className="w-full rounded-xl border border-white/10 bg-slate-950/35 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
            />
            <button
              type="button"
              onClick={regenerateBackupCodes}
              disabled={loading || !code.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              重置恢复码
            </button>
            <button
              type="button"
              onClick={disable}
              disabled={loading || !code.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              关闭 2FA
            </button>
          </div>
        </div>
      )}

      {backupCodes.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-amber-100">
              请立即保存这些一次性恢复码。
            </p>
            <button
              type="button"
              onClick={copyCodes}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-sm font-semibold text-amber-100"
            >
              <Copy className="h-4 w-4" />
              复制
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {backupCodes.map((item) => (
              <code
                key={item}
                className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-center text-xs text-amber-100"
              >
                {item}
              </code>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-200">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}
