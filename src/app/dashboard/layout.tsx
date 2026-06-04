import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 border-b border-cyan-300/10 bg-cyan-300/[0.035]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 border-t border-emerald-300/10 bg-emerald-300/[0.025]" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          userName={session.user.name ?? "用户"}
          userEmail={session.user.email ?? ""}
          userImage={session.user.image}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
