"use client";

import { validateRegistrationPassword } from "@/lib/password-policy";
import { ArrowLeft, Check, Link2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { TurnstileWidget } from "./turnstile-widget";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

interface Props {
  turnstileSiteKey: string;
  onSwitchToSignIn: () => void;
  onSuccess: (email: string, password: string) => void;
}

export function RegisterForm({
  turnstileSiteKey,
  onSwitchToSignIn,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const usernameError =
    username.length > 0 && !USERNAME_REGEX.test(username)
      ? "只允许英文字母、数字和下划线，3-30 个字符"
      : "";
  const passwordPolicyError =
    password.length > 0 ? validateRegistrationPassword(password) : "";
  const passwordError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? "两次输入的密码不一致"
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (usernameError || passwordError || passwordPolicyError) return;

    if (!email.includes("@")) {
      setError("请提供有效的邮箱地址");
      return;
    }

    const nextPasswordError = validateRegistrationPassword(password);
    if (nextPasswordError) {
      setError(nextPasswordError);
      return;
    }

    if (requiresTurnstile && !turnstileToken) {
      setError("请先完成人机验证。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "注册失败，请重试");
        resetTurnstile();
        return;
      }

      onSuccess(email.trim(), password);
    } catch {
      setError("网络错误，请检查连接后重试");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/35 backdrop-blur-2xl">
      <div className="border-b border-white/10 bg-white/[0.03] px-7 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
            <Link2 className="h-6 w-6 text-emerald-100" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
              create identity
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              创建账号
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/45">
          注册后即可拥有专属链接聚合页和个人控制台。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-7">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            邮箱地址
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-emerald-300/45 focus:ring-2 focus:ring-emerald-300/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            用户名{" "}
            <span className="text-white/25">
              公开地址：/{username || "yourname"}
            </span>
          </label>
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            className={`w-full rounded-2xl border bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:ring-2 ${
              usernameError
                ? "border-red-500/30 focus:border-red-400/50 focus:ring-red-400/10"
                : "border-white/10 focus:border-emerald-300/45 focus:ring-emerald-300/10"
            }`}
          />
          {usernameError && (
            <p className="mt-1.5 text-xs text-red-300">{usernameError}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            密码{" "}
            <span className="text-white/25">
              至少 6 位，四类字符中任选两类
            </span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="test123"
            className={`w-full rounded-2xl border bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:ring-2 ${
              passwordPolicyError
                ? "border-red-500/30 focus:border-red-400/50 focus:ring-red-400/10"
                : "border-white/10 focus:border-emerald-300/45 focus:ring-emerald-300/10"
            }`}
          />
          {passwordPolicyError && (
            <p className="mt-1.5 text-xs text-red-300">
              {passwordPolicyError}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            确认密码
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入密码"
            className={`w-full rounded-2xl border bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:ring-2 ${
              passwordError
                ? "border-red-500/30 focus:border-red-400/50 focus:ring-red-400/10"
                : "border-white/10 focus:border-emerald-300/45 focus:ring-emerald-300/10"
            }`}
          />
          {passwordError && (
            <p className="mt-1.5 text-xs text-red-300">{passwordError}</p>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {requiresTurnstile && (
          <TurnstileWidget
            key={turnstileNonce}
            siteKey={turnstileSiteKey}
            action="register"
            onVerify={setTurnstileToken}
            onError={handleTurnstileError}
          />
        )}

        <button
          type="submit"
          disabled={
            loading ||
            !!usernameError ||
            !!passwordError ||
            !!passwordPolicyError ||
            (requiresTurnstile && !turnstileToken)
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              注册中...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              注册
            </>
          )}
        </button>
      </form>

      <div className="border-t border-white/10 px-7 py-5 text-center">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="inline-flex items-center gap-1.5 text-xs text-white/35 transition hover:text-cyan-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          已有账号？返回登录
        </button>
      </div>
    </div>
  );
}
