import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppearanceClient } from "./appearance-client";

/**
 * Appearance Settings Page — Server Component
 *
 * Fetches the current theme config from DB and passes it to the client.
 */
export default async function AppearancePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const config = await prisma.themeConfig.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/70">
          Visual System
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          外观设置
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
          选择预设主题或自定义你的 LinkWeb 页面外观
        </p>
      </section>

      <AppearanceClient
        initialConfig={
          config ?? {
            id: "",
            userId: session.user.id,
            bgType: "color",
            bgValue: "#0a0a0a",
            bgBlur: 0,
            buttonStyle: "rounded",
            fontFamily: null,
            customCSS: null,
            tipEnabled: false,
            tipTitle: null,
            paypalEmail: null,
            customTipUrl: null,
            cryptoAddress: null,
            updatedAt: new Date(),
          }
        }
      />
    </div>
  );
}
