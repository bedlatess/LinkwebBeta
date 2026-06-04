"use client";

import { ImageUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function SiteIconUploader({
  initialUrl,
  disabled,
}: {
  initialUrl: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleFileChange(file: File | null) {
    if (!file) return;
    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/sys-admin/api/upload-site-icon", {
          method: "POST",
          body: formData,
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error ?? "上传失败。");
        }

        setUrl(data.siteIconUrl);
        router.replace(
          `/sys-admin/settings?toast=${encodeURIComponent("浏览器标签页图标上传成功")}`,
          { scroll: false }
        );
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "上传失败。");
      } finally {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    });
  }

  return (
    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.035] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="h-6 w-6 text-white/35" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="siteIconUrl"
            className="mb-1.5 block text-xs font-medium text-white/50"
          >
            Favicon URL / 浏览器标签页图标
          </label>
          <input
            id="siteIconUrl"
            name="siteIconUrl"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={disabled}
            placeholder="https://example.com/icon.png 或 /uploads/site/icon.png"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-emerald-300/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-300/10"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 has-disabled:cursor-not-allowed has-disabled:opacity-50">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageUp className="h-4 w-4" />
          )}
          上传 Favicon
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
            disabled={disabled || pending}
            onChange={(event) =>
              handleFileChange(event.currentTarget.files?.[0] ?? null)
            }
            className="sr-only"
          />
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/35">
        仅影响浏览器标签页、书签和快捷方式图标；不会改变首页或登录页内的品牌 Logo。支持外链或上传，上传限制 512KB，推荐 512x512 PNG/WEBP。
      </p>
      {error && (
        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
