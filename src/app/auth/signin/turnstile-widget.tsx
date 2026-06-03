"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      action?: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  action: "login" | "register";
  onVerify: (token: string) => void;
  onError?: (message: string) => void;
}

export function TurnstileWidget({
  siteKey,
  action,
  onVerify,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile?.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      action,
      callback: (token) => onVerify(token),
      "expired-callback": () => onVerify(""),
      "error-callback": () => {
        onVerify("");
        onError?.("人机验证加载失败，请刷新后重试。");
      },
    }) ?? null;

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, onError, onVerify, scriptReady, siteKey]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="flex min-h-[65px] justify-center" />
    </div>
  );
}
