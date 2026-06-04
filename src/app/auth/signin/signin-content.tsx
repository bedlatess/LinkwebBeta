"use client";

import { useCallback, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { RegisterForm } from "./register-form";
import { TurnstileWidget } from "./turnstile-widget";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5v-1.72c-2.78.62-3.37-1.38-3.37-1.38-.45-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.96c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.75-4.57 5 .36.32.68.95.68 1.92v2.86c0 .28.18.6.69.5A10.23 10.23 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface SignInContentProps {
  oauthProviders: {
    github: boolean;
    google: boolean;
  };
  turnstileSiteKey: string;
  registrationEnabled: boolean;
  siteTitle: string;
  seoDescription: string;
  supportEmail: string | null;
  adminContactLabel: string | null;
  adminContactUrl: string | null;
  siteIconUrl: string | null;
}

export function SignInContent({
  oauthProviders,
  turnstileSiteKey,
  registrationEnabled,
  siteTitle,
  seoDescription,
  supportEmail,
  adminContactLabel,
  adminContactUrl,
  siteIconUrl,
}: SignInContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);

  const hasOAuthProvider = oauthProviders.github || oauthProviders.google;
  const requiresTurnstile = Boolean(turnstileSiteKey);
  const contactHref =
    adminContactUrl || (supportEmail ? `mailto:${supportEmail}` : null);
  const contactLabel = adminContactLabel || "联系管理员";
  const contactOpensNewTab =
    contactHref?.startsWith("http://") || contactHref?.startsWith("https://");

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    setTurnstileNonce((nonce) => nonce + 1);
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setFormError(message);
  }, []);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormNotice("");

    if (requiresTurnstile && !turnstileToken) {
      setFormError("请先完成人机验证。");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      turnstileToken,
      redirect: false,
    });

    if (result?.error) {
      setFormError(
        result.code === "account_banned"
          ? "此账号已被系统管理员封禁。"
          : "人机验证未通过，或邮箱密码错误，请重试。"
      );
      resetTurnstile();
      return;
    }

    startTransition(() => {
      router.push(callbackUrl);
      router.refresh();
    });
  }

  function handleOAuthSignIn(provider: "github" | "google") {
    signIn(provider, { callbackUrl });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-x-0 top-0 h-28 border-b border-cyan-300/10 bg-cyan-300/[0.035]" />
      <div className="absolute inset-x-0 bottom-0 h-28 border-t border-emerald-300/10 bg-emerald-300/[0.025]" />

      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/75">
              <ShieldCheck className="h-3.5 w-3.5" />
              secure identity node
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              登录你的
              <span className="block text-cyan-200">个人链接控制台</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/55">
              {seoDescription}
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "链接、主题、点击数据统一归档",
                "注册入口、OAuth 与封禁策略由系统后台控制",
                "演示账号可直接体验公开主页和普通控制台",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/62 backdrop-blur-xl"
                >
                  <BadgeCheck className="h-4 w-4 text-emerald-200" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          {mode === "register" && registrationEnabled ? (
            <RegisterForm
              turnstileSiteKey={turnstileSiteKey}
              onSwitchToSignIn={() => setMode("signin")}
              onSuccess={(email, password) => {
                setEmail(email);
                setPassword(password);
                setFormNotice("注册成功，请完成人机验证后登录。");
                resetTurnstile();
                setMode("signin");
              }}
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/35 backdrop-blur-2xl">
              <div className="border-b border-white/10 bg-white/[0.03] px-7 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                    {siteIconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={siteIconUrl}
                        alt=""
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <LockKeyhole className="h-6 w-6 text-cyan-100" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
                      {siteTitle}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                      账号登录
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-7">
                {hasOAuthProvider && (
                  <div className="mb-5 grid gap-3">
                    {oauthProviders.github && (
                      <button
                        type="button"
                        onClick={() => handleOAuthSignIn("github")}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                      >
                        <GitHubIcon className="h-5 w-5" />
                        使用 GitHub 登录
                      </button>
                    )}

                    {oauthProviders.google && (
                      <button
                        type="button"
                        onClick={() => handleOAuthSignIn("google")}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                      >
                        <GoogleIcon className="h-5 w-5" />
                        使用 Google 登录
                      </button>
                    )}
                  </div>
                )}

                {hasOAuthProvider && (
                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-950/70 px-3 text-xs text-white/32">
                        或使用账号密码登录
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-medium text-white/50"
                    >
                      邮箱地址
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="test@pawn.eu.org"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-xs font-medium text-white/50"
                    >
                      密码
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="test123"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10"
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

                  {formNotice && (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                      {formNotice}
                    </div>
                  )}

                  {(formError || error) && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {formError ||
                        (searchParams.get("code") === "account_banned"
                          ? "此账号已被系统管理员封禁。"
                          : error === "CredentialsSignin"
                          ? "邮箱或密码错误，请重试。"
                          : "登录过程中发生错误，请重试。")}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isPending || (requiresTurnstile && !turnstileToken)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      <>
                        登录
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                {registrationEnabled && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="inline-flex items-center gap-1.5 text-xs text-white/35 transition hover:text-cyan-200"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      没有账号？立即注册
                    </button>
                  </div>
                )}

                <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-center text-xs text-white/32">
                  <p>
                    演示账号：
                    <span className="font-mono text-white/58">
                      test@pawn.eu.org / test123
                    </span>
                    <Link
                      href="/test"
                      className="ml-2 text-cyan-200/75 underline-offset-4 transition hover:text-cyan-100 hover:underline"
                    >
                      查看演示主页
                    </Link>
                  </p>
                  {contactHref && (
                    <p>
                      需要帮助？
                      <a
                        href={contactHref}
                        target={contactOpensNewTab ? "_blank" : undefined}
                        rel={
                          contactOpensNewTab
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="inline-flex items-center gap-1 text-emerald-200/72 underline-offset-4 transition hover:text-emerald-100 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {contactLabel}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
