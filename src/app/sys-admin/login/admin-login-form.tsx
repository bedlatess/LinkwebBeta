"use client";

import { TurnstileWidget } from "@/app/auth/signin/turnstile-widget";
import { Loader2, LogIn } from "lucide-react";
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

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
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
