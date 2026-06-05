"use client";

import { useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  ImagePlus,
  Info,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react";

interface Props {
  userName: string;
  userEmail: string;
  username: string;
  initialImage: string | null;
  initialDomain: string | null;
  initialTwoFactorEnabled: boolean;
}

async function readJsonResponse<T extends Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export function SettingsClient({
  userName,
  userEmail,
  username,
  initialImage,
  initialDomain,
  initialTwoFactorEnabled,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(() => initialImage ?? "");
  const [savedAvatar, setSavedAvatar] = useState(() => initialImage ?? "");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSaved, setAvatarSaved] = useState(false);

  const [domain, setDomain] = useState(() => initialDomain ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [currentDomain, setCurrentDomain] = useState(() => initialDomain);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    () => initialTwoFactorEnabled
  );
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorNotice, setTwoFactorNotice] = useState("");
  const [twoFactorQr, setTwoFactorQr] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorDisableCode, setTwoFactorDisableCode] = useState("");
  const [twoFactorDisableMode, setTwoFactorDisableMode] = useState<
    "totp" | "recovery"
  >("totp");
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>(
    []
  );

  async function saveAvatar(nextImage = avatarUrl) {
    setAvatarError("");
    setAvatarSaved(false);
    setAvatarSaving(true);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: nextImage.trim() }),
      });
      const data = await readJsonResponse<{
        error?: string;
        image?: string | null;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "头像保存失败");
      setSavedAvatar(data.image ?? "");
      setAvatarUrl(data.image ?? "");
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2200);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "头像保存失败");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarError("");
    setAvatarSaved(false);
    setAvatarSaving(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await readJsonResponse<{
        error?: string;
        image?: string | null;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "头像上传失败");
      setAvatarUrl(data.image ?? "");
      setSavedAvatar(data.image ?? "");
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2200);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function saveDomain(nextDomain = domain) {
    setError("");
    setSaved(false);
    setSaving(true);

    const cleanDomain = nextDomain.trim().toLowerCase();

    try {
      const res = await fetch("/api/settings/domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain }),
      });
      const data = await readJsonResponse<{
        error?: string;
        customDomain?: string | null;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? "操作失败");
      const nextCustomDomain = data.customDomain ?? null;
      setCurrentDomain(nextCustomDomain);
      setDomain(nextCustomDomain ?? "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setSaving(false);
    }
  }

  const publicHref = username ? `/${username}` : "/";

  function twoFactorMessage(code: unknown) {
    if (code === "INVALID_TWO_FACTOR_CODE") return "验证器动态码无效。";
    if (code === "INVALID_RECOVERY_CODE") return "恢复码无效或已经使用。";
    if (code === "TWO_FACTOR_SETUP_EXPIRED") {
      return "设置会话已过期，请重新开始。";
    }
    if (code === "TWO_FACTOR_ALREADY_ENABLED") {
      return "两步验证已经启用。";
    }
    if (code === "TWO_FACTOR_NOT_ENABLED") return "两步验证尚未启用。";
    return "两步验证操作失败。";
  }

  async function startTwoFactorSetup() {
    setTwoFactorLoading(true);
    setTwoFactorError("");
    setTwoFactorNotice("");
    setTwoFactorBackupCodes([]);

    try {
      const res = await fetch("/api/settings/2fa/setup", { method: "POST" });
      const data = await readJsonResponse<{
        error?: string;
        qrCodeDataUrl?: string;
        manualSecret?: string;
      }>(res);

      if (!res.ok) throw new Error(twoFactorMessage(data.error));
      setTwoFactorQr(data.qrCodeDataUrl ?? "");
      setTwoFactorSecret(data.manualSecret ?? "");
    } catch (error) {
      setTwoFactorError(
        error instanceof Error ? error.message : "Two-factor setup failed."
      );
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function confirmTwoFactorSetup() {
    setTwoFactorLoading(true);
    setTwoFactorError("");
    setTwoFactorNotice("");

    try {
      const res = await fetch("/api/settings/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode }),
      });
      const data = await readJsonResponse<{
        error?: string;
        backupCodes?: string[];
      }>(res);

      if (!res.ok) throw new Error(twoFactorMessage(data.error));
      setTwoFactorEnabled(true);
      setTwoFactorQr("");
      setTwoFactorSecret("");
      setTwoFactorCode("");
      setTwoFactorBackupCodes(data.backupCodes ?? []);
      setTwoFactorNotice("Two-factor authentication is now enabled.");
    } catch (error) {
      setTwoFactorError(
        error instanceof Error ? error.message : "Two-factor setup failed."
      );
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function disableTwoFactor() {
    setTwoFactorLoading(true);
    setTwoFactorError("");
    setTwoFactorNotice("");

    try {
      const res = await fetch("/api/settings/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: twoFactorDisableCode,
          mode: twoFactorDisableMode,
        }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);

      if (!res.ok) throw new Error(twoFactorMessage(data.error));
      setTwoFactorEnabled(false);
      setTwoFactorDisableCode("");
      setTwoFactorDisableMode("totp");
      setTwoFactorBackupCodes([]);
      setTwoFactorNotice("两步验证已关闭，原恢复码已自动失效。");
    } catch (error) {
      setTwoFactorError(
        error instanceof Error ? error.message : "Two-factor disable failed."
      );
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function regenerateBackupCodes() {
    setTwoFactorLoading(true);
    setTwoFactorError("");
    setTwoFactorNotice("");

    try {
      const res = await fetch("/api/settings/2fa/backup-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorDisableCode }),
      });
      const data = await readJsonResponse<{
        error?: string;
        backupCodes?: string[];
      }>(res);

      if (!res.ok) throw new Error(twoFactorMessage(data.error));
      setTwoFactorBackupCodes(data.backupCodes ?? []);
      setTwoFactorDisableCode("");
      setTwoFactorNotice("新的恢复码已生成，旧恢复码已失效。");
    } catch (error) {
      setTwoFactorError(
        error instanceof Error
          ? error.message
          : "恢复码重新生成失败。"
      );
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function copyBackupCodes() {
    await navigator.clipboard.writeText(twoFactorBackupCodes.join("\n"));
    setTwoFactorNotice("恢复码已复制。");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/10">
            {savedAvatar ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="h-8 w-8 text-white/35" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={savedAvatar}
                  alt=""
                  className="relative h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.display = "block";
                  }}
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-white/35" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight text-white">
              @{username || "unset"}
            </p>
            <p className="mt-1 truncate text-sm text-white/45">{userEmail}</p>
            <p className="mt-3 text-sm leading-6 text-white/38">
              当前昵称：{userName || "未设置"}
            </p>
          </div>
        </div>

        <a
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-400/15"
        >
          <Globe className="h-4 w-4" />
          打开公开主页
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/88">
              自定义头像
            </h2>
            <p className="text-sm text-white/40">
              支持外链或直接上传图片，公开主页和控制台会同步使用。
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-emerald-300/45 focus:ring-2 focus:ring-emerald-300/10"
          />
          <button
            type="button"
            onClick={() => saveAvatar()}
            disabled={avatarSaving || avatarUrl === savedAvatar}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {avatarSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : avatarSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              "保存"
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadAvatar(file);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarSaving}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            上传图片
          </button>
          <button
            type="button"
            onClick={() => saveAvatar("")}
            disabled={avatarSaving || !savedAvatar}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            清除头像
          </button>
        </div>

        {avatarError && (
          <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {avatarError}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl xl:col-span-2">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/88">
              自定义域名绑定
            </h2>
            <p className="text-sm text-white/40">
              绑定后，访客可直接通过你的域名进入公开主页。
            </p>
          </div>
        </div>

        {currentDomain && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-100">
              <Check className="h-4 w-4 shrink-0" />
              <span className="truncate">已绑定：{currentDomain}</span>
            </div>
            <button
              onClick={() => saveDomain("")}
              disabled={saving}
              className="sm:ml-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/58 transition hover:bg-white/[0.08] hover:text-red-200 disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
              解绑
            </button>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="link.yourbrand.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10"
          />
          <button
            onClick={() => saveDomain()}
            disabled={saving || domain === currentDomain}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              "保存域名"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/60" />
            <div className="space-y-2 text-sm leading-6 text-white/42">
              <p className="font-semibold text-white/65">DNS 配置提示</p>
              <p>
                根域名建议添加 A 记录指向服务器 IP；子域名也可添加 CNAME
                指向你的主站域名。若使用 Nginx Proxy Manager，请为该域名创建
                Proxy Host 并转发到 `127.0.0.1:2222`。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl xl:col-span-2">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
              <h2 className="text-base font-semibold text-white/88">
                两步验证
              </h2>
            <p className="text-sm text-white/40">
              使用验证器 App 保护账号，不使用邮件或短信验证码。
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white/80">
                当前状态：{twoFactorEnabled ? "已启用" : "未启用"}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/42">
                使用 Google Authenticator、Microsoft Authenticator、1Password、Bitwarden、Aegis
                或其他兼容 TOTP 的验证器扫描二维码。
              </p>
            </div>
            {!twoFactorEnabled && !twoFactorQr && (
              <button
                type="button"
                onClick={startTwoFactorSetup}
                disabled={twoFactorLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {twoFactorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                启用 2FA
              </button>
            )}
          </div>
        </div>

        {twoFactorQr && !twoFactorEnabled && (
          <div className="mt-4 grid gap-5 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.035] p-4 lg:grid-cols-[auto_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={twoFactorQr}
              alt="Two-factor QR-Code"
              className="h-48 w-48 rounded-2xl bg-white p-3"
            />
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white/80">
                  1. 扫描二维码
                </p>
                <p className="mt-1 text-sm text-white/42">
                  如果无法扫码，请手动输入下面的密钥：
                </p>
                <code className="mt-2 block break-all rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-emerald-100">
                  {twoFactorSecret}
                </code>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50">
                  <KeyRound className="h-3.5 w-3.5" />
                  2. 输入 6 位动态码
                </label>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    inputMode="numeric"
                    placeholder="123456"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-emerald-300/45 focus:ring-2 focus:ring-emerald-300/10"
                  />
                  <button
                    type="button"
                    onClick={confirmTwoFactorSetup}
                    disabled={twoFactorLoading || !twoFactorCode.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {twoFactorLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    确认启用
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {twoFactorEnabled && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50">
              <KeyRound className="h-3.5 w-3.5" />
              关闭或重置前请先验证身份
            </label>
            <div className="mb-3 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/35 p-1">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorDisableMode("totp");
                  setTwoFactorDisableCode("");
                  setTwoFactorError("");
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  twoFactorDisableMode === "totp"
                    ? "bg-emerald-300 text-slate-950"
                    : "text-white/45 hover:text-white"
                }`}
              >
                验证器动态码
              </button>
              <button
                type="button"
                onClick={() => {
                  setTwoFactorDisableMode("recovery");
                  setTwoFactorDisableCode("");
                  setTwoFactorError("");
                }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  twoFactorDisableMode === "recovery"
                    ? "bg-emerald-300 text-slate-950"
                    : "text-white/45 hover:text-white"
                }`}
              >
                恢复码
              </button>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <input
                value={twoFactorDisableCode}
                onChange={(event) =>
                  setTwoFactorDisableCode(event.target.value)
                }
                inputMode={twoFactorDisableMode === "totp" ? "numeric" : "text"}
                placeholder={
                  twoFactorDisableMode === "totp" ? "123456" : "ABCDE-12345"
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-emerald-300/45 focus:ring-2 focus:ring-emerald-300/10"
              />
              <button
                type="button"
                onClick={regenerateBackupCodes}
                disabled={
                  twoFactorLoading ||
                  !twoFactorDisableCode.trim() ||
                  twoFactorDisableMode !== "totp"
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                生成新恢复码
              </button>
              <button
                type="button"
                onClick={disableTwoFactor}
                disabled={twoFactorLoading || !twoFactorDisableCode.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                关闭 2FA
              </button>
            </div>
          </div>
        )}

        {twoFactorBackupCodes.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  请立即保存这些恢复码。
                </p>
                <p className="mt-1 text-sm text-amber-100/60">
                  每个恢复码只能使用一次；关闭 2FA 后这些恢复码会自动失效。
                </p>
              </div>
              <button
                type="button"
                onClick={copyBackupCodes}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/15"
              >
                <Copy className="h-4 w-4" />
                复制
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {twoFactorBackupCodes.map((code) => (
                <code
                  key={code}
                  className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-center text-xs text-amber-100"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        {twoFactorNotice && (
          <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {twoFactorNotice}
          </p>
        )}

        {twoFactorError && (
          <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {twoFactorError}
          </p>
        )}
      </section>
    </div>
  );
}
