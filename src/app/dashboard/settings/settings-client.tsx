"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  Check,
  ExternalLink,
  Globe,
  ImagePlus,
  Info,
  Loader2,
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
}

export function SettingsClient({
  userName,
  userEmail,
  username,
  initialImage,
  initialDomain,
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
      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "操作失败");
      setCurrentDomain(data.customDomain);
      setDomain(data.customDomain ?? "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setSaving(false);
    }
  }

  const publicHref = username ? `/${username}` : "/";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/10">
            {savedAvatar ? (
              <Image
                src={savedAvatar}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
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
    </div>
  );
}
