import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

/**
 * Account Settings Page — Server Component
 *
 * Fetches user profile + custom domain and passes to client.
 */
export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      username: true,
      image: true,
      customDomain: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
          Account Center
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          账号中心
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
          管理头像、公开主页入口、自定义域名和账号基础信息。
        </p>
      </div>

      <SettingsClient
        userName={user?.name ?? "未设置"}
        userEmail={user?.email ?? ""}
        username={user?.username ?? ""}
        initialImage={user?.image ?? null}
        initialDomain={user?.customDomain ?? null}
      />
    </div>
  );
}
