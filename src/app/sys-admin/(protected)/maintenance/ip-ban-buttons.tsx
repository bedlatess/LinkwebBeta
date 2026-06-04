"use client";

import { Trash2 } from "lucide-react";

export function IpBanDeleteButton({ value }: { value: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const ok = window.confirm(`确认删除 IP 封禁规则 ${value} 吗？`);
        if (!ok) event.preventDefault();
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/18"
    >
      <Trash2 className="h-3.5 w-3.5" />
      删除
    </button>
  );
}
