"use client";

import { TurnstileWidget } from "@/app/auth/signin/turnstile-widget";
import { resolveAllowedAdminPath } from "@/lib/admin-route-permissions";
import { KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface AdminLoginFormProps {
  turnstileSiteKey: string;
}

export function AdminLoginForm({ turnstileSiteKey }: AdminLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/sys-admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const [step, setStep] = useState<"password" | "two-factor">("password");
  const [twoFactorTarget, setTwoFactorTarget] = useState<"super" | "normal">(
    "super"
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorMode, setTwoFactorMode] = useState<"totp" | "recovery">(
    "totp"
  );

  const requiresTurnstile = Boolean(turnstileSiteKey);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileNonce((nonce) => nonce + 1);
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setError(message);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (requiresTurnstile && !turnstileToken) {
      setError("请先完成人机验证。");
      return;
    }

    setLoading(true);

    try {
      // First try the independent CLI-created super admin account.
      const response = await fetch("/sys-admin/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok) {
        if (data?.requiresTwoFactor) {
          setTwoFactorTarget("super");
          setStep("two-factor");
          setPassword("");
          setLoading(false);
          return;
        }

        router.push(callbackUrl);
        router.refresh();
        return;
      }

      // If this is not a super admin account, fall back to elevated normal users.
      const result = await signIn("credentials", {
        email,
        password,
        turnstileToken,
        redirect: false,
      });

      if (result?.error) {
        if (result.code === "two_factor_required") {
          setTwoFactorTarget("normal");
          setStep("two-factor");
          setPassword("");
          setLoading(false);
          setError("该管理员账号已开启 2FA，请使用两步验证方式登录。");
          resetTurnstile();
          return;
        }

        setError(
          result.code === "account_banned"
            ? "此账号已被系统管理员封禁。"
            : data?.error ?? "管理员邮箱或密码错误。"
        );
        resetTurnstile();
        return;
      }

      const session = await getSession();

      if (session?.user?.role !== "ADMIN") {
        await signOut({ redirect: false });
        setError("该账号尚未被授予系统后台管理员身份。");
        resetTurnstile();
        return;
      }

      router.push(
        resolveAllowedAdminPath(
          {
            permManageUsers: session.user.permManageUsers,
            permDeleteUsers: session.user.permDeleteUsers,
            permManageLinks: session.user.permManageLinks,
            permManageSettings: session.user.permManageSettings,
            permToggleMaintenance: session.user.permToggleMaintenance,
            permViewUsers: session.user.permViewUsers,
            permBanUsers: session.user.permBanUsers,
            permEditUsers: session.user.permEditUsers,
            permResetUserPasswords: session.user.permResetUserPasswords,
            permManageUserEntitlements:
              session.user.permManageUserEntitlements,
            permViewLinks: session.user.permViewLinks,
            permDeleteLinks: session.user.permDeleteLinks,
            permManageSiteSettings: session.user.permManageSiteSettings,
            permManageAuthSettings: session.user.permManageAuthSettings,
            permRunMaintenance: session.user.permRunMaintenance,
          },
          callbackUrl
        )
      );
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (twoFactorTarget === "normal") {
        if (requiresTurnstile && !turnstileToken) {
          setError("请先完成人机验证。");
          setLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          email,
          twoFactorCode,
          twoFactorMode,
          turnstileToken,
          redirect: false,
        });

        if (result?.error) {
          setError(
            result.code === "invalid_two_factor_code"
              ? twoFactorMode === "recovery"
                ? "恢复码无效或已经使用。"
                : "验证器动态码无效，请重试。"
              : "两步验证登录失败，请检查邮箱和验证码。"
          );
          resetTurnstile();
          return;
        }

        const session = await getSession();

        if (session?.user?.role !== "ADMIN") {
          await signOut({ redirect: false });
          setError("该账号尚未被授予系统后台管理员身份。");
          resetTurnstile();
          return;
        }

        router.push(
          resolveAllowedAdminPath(
            {
              permManageUsers: session.user.permManageUsers,
              permDeleteUsers: session.user.permDeleteUsers,
              permManageLinks: session.user.permManageLinks,
              permManageSettings: session.user.permManageSettings,
              permToggleMaintenance: session.user.permToggleMaintenance,
              permViewUsers: session.user.permViewUsers,
              permBanUsers: session.user.permBanUsers,
              permEditUsers: session.user.permEditUsers,
              permResetUserPasswords: session.user.permResetUserPasswords,
              permManageUserEntitlements:
                session.user.permManageUserEntitlements,
              permViewLinks: session.user.permViewLinks,
              permDeleteLinks: session.user.permDeleteLinks,
              permManageSiteSettings: session.user.permManageSiteSettings,
              permManageAuthSettings: session.user.permManageAuthSettings,
              permRunMaintenance: session.user.permRunMaintenance,
            },
            callbackUrl
          )
        );
        router.refresh();
        return;
      }

      const response = await fetch("/sys-admin/api/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: twoFactorCode,
          mode: twoFactorMode,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error === "INVALID_RECOVERY_CODE"
            ? "恢复码无效或已经使用。"
            : data?.error === "TWO_FACTOR_SETUP_EXPIRED"
            ? "两步验证会话已过期，请重新输入管理员密码。"
            : "验证码无效，请重试。"
        );

        if (data?.error === "TWO_FACTOR_SETUP_EXPIRED") {
          setStep("password");
          setTwoFactorCode("");
        }

        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  if (step === "two-factor") {
    return (
      <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100/80">
          管理员密码已验证，请输入验证器 App 中的 6 位动态码。
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => {
              setTwoFactorMode("totp");
              setTwoFactorCode("");
              setError("");
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              twoFactorMode === "totp"
                ? "bg-emerald-300 text-slate-950"
                : "text-white/45 hover:text-white"
            }`}
          >
            验证器
          </button>
          <button
            type="button"
            onClick={() => {
              setTwoFactorMode("recovery");
              setTwoFactorCode("");
              setError("");
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              twoFactorMode === "recovery"
                ? "bg-emerald-300 text-slate-950"
                : "text-white/45 hover:text-white"
            }`}
          >
            恢复码
          </button>
        </div>

        <div>
          <label
            htmlFor="admin-two-factor-code"
            className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
          >
            {twoFactorMode === "totp" ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            {twoFactorMode === "totp" ? "6 位验证码" : "恢复码"}
          </label>
          <input
            id="admin-two-factor-code"
            value={twoFactorCode}
            onChange={(event) => setTwoFactorCode(event.target.value)}
            inputMode={twoFactorMode === "totp" ? "numeric" : "text"}
            autoComplete="one-time-code"
            required
            placeholder={twoFactorMode === "totp" ? "123456" : "ABCDE-12345"}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !twoFactorCode.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          完成两步验证
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("password");
            setTwoFactorTarget("super");
            setTwoFactorCode("");
            setError("");
            resetTurnstile();
          }}
          className="w-full text-center text-xs text-white/35 transition hover:text-white/65"
        >
          返回密码登录
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-xs font-medium text-white/50"
        >
          管理员邮箱
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-xs font-medium text-white/50"
        >
          管理员密码
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入管理员密码"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
        />
      </div>

      {requiresTurnstile && (
        <TurnstileWidget
          key={turnstileNonce}
          siteKey={turnstileSiteKey}
          action="login"
          onVerify={setTurnstileToken}
          onError={handleTurnstileError}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (requiresTurnstile && !turnstileToken)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        进入系统后台
      </button>
    </form>
  );
}
