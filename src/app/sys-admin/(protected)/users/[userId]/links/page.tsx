import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Link2,
  MousePointerClick,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteLinkButton } from "../../../links/delete-link-button";
import { deleteGlobalLink } from "../../../links/link-actions";

interface Props {
  params: Promise<{ userId: string }>;
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ManagedUserLinksPage({ params }: Props) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      links: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: { visitLogs: true },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = user.name ?? user.username ?? user.email ?? "未命名用户";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <Link
          href={`/sys-admin/users/${user.id}/edit`}
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          返回上一页(代管面板)
        </Link>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/70">
              User Link Assets
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {displayName} 的链接资产
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              管理该用户创建的所有专属链接，可直接删除异常或违规目标地址。
            </p>
          </div>
          <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-100/75">
            共 {user.links.length} 条链接
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.035] text-xs uppercase tracking-[0.18em] text-white/38">
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">URL</th>
                <th className="px-5 py-4 font-medium">点击量</th>
                <th className="px-5 py-4 font-medium">启用状态</th>
                <th className="px-5 py-4 font-medium">创建时间</th>
                <th className="px-5 py-4 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {user.links.map((link) => (
                <tr
                  key={link.id}
                  className="bg-white/[0.01] transition hover:bg-white/[0.035]"
                >
                  <td className="px-5 py-4">
                    <div className="flex max-w-72 items-center gap-2">
                      <Link2 className="h-4 w-4 shrink-0 text-cyan-200/60" />
                      <span className="truncate text-sm font-medium text-white/82">
                        {link.title || "未命名链接"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {link.url ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-md items-center gap-1.5 truncate rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs text-cyan-100/75 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-red-200/70">空 URL</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/55">
                      <MousePointerClick className="h-3.5 w-3.5" />
                      {link._count.visitLogs}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {link.isVisible ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        已启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/38">
                        <EyeOff className="h-3.5 w-3.5" />
                        已隐藏
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-white/50">
                    {dateFormatter.format(link.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <form
                        action={async () => {
                          "use server";
                          await deleteGlobalLink(link.id);
                        }}
                      >
                        <DeleteLinkButton title={link.title || link.url} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {user.links.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-white/55">暂无链接资产</p>
            <p className="mt-1 text-xs text-white/30">
              该用户还没有创建任何链接，或已被管理员清理。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
