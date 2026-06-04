"use client";

import { getLinkIconOption } from "@/lib/link-icons";
import {
  Check,
  Coffee,
  Copy,
  ExternalLink,
  Globe,
  Heart,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

interface LinkData {
  id: string;
  title: string;
  url: string;
  iconName: string | null;
}

interface ThemeData {
  bgType: string;
  bgValue: string;
  bgBlur: number;
  buttonStyle: string;
  fontFamily: string | null;
  customCSS: string | null;
  tipEnabled: boolean;
  tipTitle: string | null;
  paypalEmail: string | null;
  customTipUrl: string | null;
  cryptoAddress: string | null;
}

interface Props {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  links: LinkData[];
  theme: ThemeData;
}

export function PublicLinkPage({
  username,
  displayName,
  bio,
  avatarUrl,
  links,
  theme,
}: Props) {
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const customTipUrl = theme.customTipUrl?.trim() || null;
  const paypalTarget = theme.paypalEmail?.trim() || null;
  const cryptoAddress = theme.cryptoAddress?.trim() || null;
  const hasTipDetails = Boolean(customTipUrl || paypalTarget || cryptoAddress);
  const tipLabel = theme.tipTitle || "赞助 / 打赏";

  const trackClick = useCallback(async (linkId: string) => {
    try {
      await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
    } catch {
      // Click tracking should never block navigation.
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Ignore clipboard failures; the value is still visible.
    }
  }, []);

  const openTipTarget = useCallback(
    (target: string | null, type: "custom" | "paypal" = "custom") => {
      const href =
        type === "paypal"
          ? normalizePaypalTarget(target)
          : normalizeHttpTarget(target);

      if (!href) {
        window.location.assign(window.location.href);
        return;
      }

      window.open(href, "_blank", "noopener,noreferrer");
    },
    []
  );

  const bgStyle: React.CSSProperties = {};
  if (theme.bgType === "color" || theme.bgType === "gradient") {
    bgStyle.background = theme.bgValue;
  }
  if (theme.fontFamily) {
    bgStyle.fontFamily = theme.fontFamily;
  }
  if (!theme.bgValue || theme.bgValue === "#0a0a0a") {
    bgStyle.background = "#020617";
  }

  const hasBlur = theme.bgBlur > 0;
  const buttonRadiusClass =
    theme.buttonStyle === "pill"
      ? "rounded-full"
      : theme.buttonStyle === "square"
        ? "rounded-lg"
        : "rounded-2xl";

  const isDarkBg =
    theme.bgType === "gradient" ||
    (theme.bgType === "color" && isColorDark(theme.bgValue));

  const textColor = isDarkBg ? "text-white" : "text-slate-800";
  const textMuted = isDarkBg ? "text-white/60" : "text-slate-500";
  const cardBg = isDarkBg
    ? "bg-white/[0.06] border-white/[0.08]"
    : "bg-white/70 border-slate-200/50";
  const cardHover = isDarkBg
    ? "hover:bg-white/[0.12] hover:border-white/[0.18]"
    : "hover:bg-white/90 hover:border-slate-300/60";
  const avatarRing = isDarkBg ? "ring-white/15" : "ring-slate-300/60";

  return (
    <div
      className="linkweb-public relative flex min-h-screen flex-col items-center overflow-hidden"
      style={bgStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 border-b border-white/10 bg-white/[0.025]" />

      <main className="relative z-10 flex w-full max-w-lg flex-1 flex-col items-center px-4 py-16">
        <div className="mb-4">
          {avatarUrl ? (
            <div
              className={`relative h-20 w-20 overflow-hidden rounded-full ring-2 ${avatarRing}`}
            >
              <div
                className={`absolute inset-0 flex items-center justify-center ${cardBg}`}
              >
                <Globe
                  className={`h-8 w-8 ${
                    isDarkBg ? "text-white/25" : "text-slate-400"
                  }`}
                />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={displayName}
                className="relative h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                onLoad={(event) => {
                  event.currentTarget.style.display = "block";
                }}
              />
            </div>
          ) : (
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl ${cardBg} ring-2 ${avatarRing}`}
            >
              <Globe
                className={`h-8 w-8 ${
                  isDarkBg ? "text-white/25" : "text-slate-400"
                }`}
              />
            </div>
          )}
        </div>

        <h1 className={`text-xl font-bold ${textColor}`}>@{username}</h1>

        {bio && (
          <p
            className={`mt-3 max-w-sm text-center text-sm leading-relaxed ${textMuted}`}
          >
            {bio}
          </p>
        )}

        {theme.tipEnabled && (
          <button
            onClick={() => setTipModalOpen(true)}
            className={`mt-6 flex items-center gap-2 border border-rose-400/25 bg-rose-400/[0.1] px-5 py-2.5 text-sm font-medium text-rose-200 backdrop-blur-sm transition-all duration-300 hover:border-rose-300/40 hover:bg-rose-400/[0.16] hover:text-white ${buttonRadiusClass}`}
          >
            <Heart className="h-4 w-4" />
            {tipLabel}
          </button>
        )}

        <div className="mt-8 w-full space-y-3">
          {links.map((link) => {
            const Icon = getLinkIconOption(link.iconName).icon;

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(link.id)}
                className={`flex items-center gap-3 border px-5 py-3.5 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 ${cardBg} ${cardHover} ${buttonRadiusClass} ${
                  hasBlur ? "backdrop-blur-md" : ""
                }`}
                style={
                  hasBlur
                    ? { backdropFilter: `blur(${theme.bgBlur}px)` }
                    : undefined
                }
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${
                    isDarkBg ? "text-white/70" : "text-slate-600"
                  }`}
                />
                <span
                  className={`flex-1 truncate text-sm font-medium ${textColor}`}
                >
                  {link.title}
                </span>
                <ExternalLink
                  className={`h-4 w-4 flex-shrink-0 ${
                    isDarkBg ? "text-white/25" : "text-slate-400"
                  }`}
                />
              </a>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className={`mt-12 text-center ${textMuted}`}>
            <p className="text-sm">还没有添加链接</p>
          </div>
        )}
      </main>

      <footer className="relative z-10 w-full py-6 text-center">
        <p
          className={`text-xs ${
            isDarkBg ? "text-white/15" : "text-slate-350"
          }`}
        >
          Powered by{" "}
          <a
            href="https://github.com/bedlatess/LinkwebBeta"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-70"
          >
            LinkWeb
          </a>
        </p>
      </footer>

      {tipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setTipModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <button
              onClick={() => setTipModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <Coffee className="mx-auto mb-3 h-8 w-8 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">{tipLabel}</h2>
              <p className="mt-1 text-xs text-white/40">
                选择一个方式继续支持创作者
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {customTipUrl && (
                <TipLinkRow
                  copied={copiedField === "custom"}
                  label="自定义赞助链接"
                  value={customTipUrl}
                  onCopy={() => copyToClipboard(customTipUrl, "custom")}
                  onOpen={() => openTipTarget(customTipUrl, "custom")}
                />
              )}

              {paypalTarget && (
                <TipLinkRow
                  copied={copiedField === "paypal"}
                  label="PayPal"
                  value={paypalTarget}
                  onCopy={() => copyToClipboard(paypalTarget, "paypal")}
                  onOpen={() => openTipTarget(paypalTarget, "paypal")}
                />
              )}

              {cryptoAddress && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-xs font-medium text-white/50">
                    加密货币收款地址
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="max-w-[220px] truncate font-mono text-xs text-white/50">
                      {cryptoAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(cryptoAddress, "crypto")}
                      className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
                      title="复制加密货币地址"
                    >
                      {copiedField === "crypto" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {!hasTipDetails && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <p className="text-xs leading-5 text-white/35">
                    该创作者暂未配置具体收款信息。
                  </p>
                  <button
                    onClick={() => openTipTarget(null)}
                    className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    返回当前页面
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TipLinkRow({
  copied,
  label,
  onCopy,
  onOpen,
  value,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  onOpen: () => void;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-white/60">
          {value}
        </span>
        <button
          onClick={onOpen}
          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
          title={`打开${label}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCopy}
          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
          title={`复制${label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function normalizeHttpTarget(target: string | null) {
  if (!target) return null;

  try {
    const url = new URL(target);
    return ["http:", "https:"].includes(url.protocol) ? target : null;
  } catch {
    return null;
  }
}

function normalizePaypalTarget(target: string | null) {
  if (!target) return null;

  const httpTarget = normalizeHttpTarget(target);
  if (httpTarget) return httpTarget;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    return `mailto:${target}`;
  }

  return null;
}

function isColorDark(hex: string): boolean {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return true;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}
