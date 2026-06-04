"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { createIpBanRule } from "./ip-ban-actions";

export function IpBanForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        await createIpBanRule(formData);
      } catch (error) {
        setError(error instanceof Error ? error.message : "保存 IP 规则失败。");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
        <input
          name="value"
          required
          placeholder="1.2.3.4 或 1.2.3.0/24"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-red-300/45 focus:ring-2 focus:ring-red-300/10"
        />
        <input
          name="reason"
          placeholder="封禁原因"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-red-300/45 focus:ring-2 focus:ring-red-300/10"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/25 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          保存规则
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </form>
  );
}
