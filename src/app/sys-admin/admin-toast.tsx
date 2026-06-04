"use client";

import { CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AdminToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = searchParams.get("toast");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams, toast]);

  if (!toast) {
    return null;
  }

  function dismiss() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="fixed right-4 top-20 z-[120] w-[calc(100vw-2rem)] max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-slate-950/92 p-4 text-emerald-100 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-emerald-200">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">操作完成</p>
          <p className="mt-1 text-sm leading-5 text-white/58">
            {toast}
          </p>
        </div>
        <button
          type="button"
          aria-label="关闭提示"
          onClick={dismiss}
          className="rounded-lg p-1 text-white/35 transition hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
