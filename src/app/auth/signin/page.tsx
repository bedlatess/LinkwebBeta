import { Suspense } from "react";
import { SignInContent } from "./signin-content";
import { getGlobalSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

/**
 * LinkWeb Sign-In Page — Wrapped in Suspense for useSearchParams()
 */
export default async function SignInPage() {
  const settings = await getGlobalSiteSettings();
  const oauthProviders = {
    github: Boolean(
      settings.oauthEnabled &&
        process.env.GITHUB_CLIENT_ID &&
        process.env.GITHUB_SECRET
    ),
    google: Boolean(
      settings.oauthEnabled &&
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_SECRET
    ),
  };
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      }
    >
      <SignInContent
        oauthProviders={oauthProviders}
        turnstileSiteKey={turnstileSiteKey}
        registrationEnabled={settings.registrationEnabled}
      />
    </Suspense>
  );
}
