"use client";

import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TWO_FACTOR_CODE: "验证器动态码无效，请重新输入。",
  INVALID_RECOVERY_CODE: "恢复码无效或已经使用。",
  TWO_FACTOR_NOT_ENABLED: "该账号尚未开启两步验证。",
};

export function TwoFactorChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/settings/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, mode }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const key = typeof data?.error === "string" ? data.error : "";
      setError(ERROR_MESSAGES[key] ?? "验证失败，请重试。");
      return;
    }

    startTransition(() => {
      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("totp");
            setCode("");
            setError("");
          }}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            mode === "totp"
              ? "bg-cyan-300 text-slate-950"
              : "text-white/45 hover:text-white"
          }`}
        >
          验证器动态码
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("recovery");
            setCode("");
            setError("");
          }}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            mode === "recovery"
              ? "bg-cyan-300 text-slate-950"
              : "text-white/45 hover:text-white"
          }`}
        >
          恢复码
        </button>
      </div>

      <div>
        <label
          htmlFor="two-factor-code"
          className="mb-1.5 flex items-center gap-2 text-xs font-medium text-white/50"
        >
          {mode === "totp" ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          {mode === "totp" ? "6 位动态码" : "一次性恢复码"}
        </label>
        <input
          id="two-factor-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode={mode === "totp" ? "numeric" : "text"}
          autoComplete="one-time-code"
          required
          placeholder={mode === "totp" ? "123456" : "ABCDE-12345"}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/10"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !code.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        验证并继续
      </button>
    </form>
  );
}
