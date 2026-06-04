import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ExternalLink,
  Link2,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteLinkButton } from "./delete-link-button";
import { deleteGlobalLink } from "./link-actions";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminLinksReviewPage({ searchParams }: Props) {
  const actor = await getAdminActor();

  if (!actor?.permissions.permManageLinks) {
    notFound();
  }

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const links = await prisma.link.findMany({
    where: query ? { url: { contains: query } } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          customDomain: true,
          image: true,
          name: true,
        },
      },
      _count: {
        select: { visitLogs: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-red-200/70">
              Content Review
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              平台内容安全审查
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              全站链接池集中巡检。发现钓鱼、灰黑产或违规 URL，可立即物理删除并阻断流量。
            </p>
          </div>

          <form className="flex w-full gap-2 sm:max-w-md">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                name="q"
                defaultValue={query}
                placeholder="搜索 URL 关键词"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-red-300/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-red-300/10"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/15"
            >
              <ShieldAlert className="h-4 w-4" />
              搜索
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/45">
            <AlertTriangle className="h-3.5 w-3.5 text-red-200" />
            {query ? `匹配 ${links.length} 条链接` : `全站 ${links.length} 条链接`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.035] text-xs uppercase tracking-[0.18em] text-white/38">
                <th className="px-5 py-4 font-medium">创建者</th>
                <th className="px-5 py-4 font-medium">标题</th>
                <th className="px-5 py-4 font-medium">目标 URL</th>
                <th className="px-5 py-4 font-medium">点击数</th>
                <th className="px-5 py-4 font-medium">创建时间</th>
                <th className="px-5 py-4 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {links.map((link) => {
                const ownerName =
                  link.user.name ??
                  link.user.username ??
                  link.user.email ??
                  "未知用户";

                return (
                  <tr
                    key={link.id}
                    className="bg-white/[0.01] transition hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {link.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={link.user.image}
                            alt=""
                            className="h-9 w-9 rounded-full border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/35">
                            <UserRound className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/82">
                            {ownerName}
                          </p>
                          <p className="truncate text-xs text-white/35">
                            {link.user.email ?? "未绑定邮箱"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-cyan-200/55">
                            {link.user.customDomain ??
                              (link.user.username
                                ? `/${link.user.username}`
                                : "未设置二级标识")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-64 items-center gap-2">
                        <Link2 className="h-4 w-4 shrink-0 text-cyan-200/60" />
                        <span className="truncate text-sm font-medium text-white/80">
                          {link.title}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-md items-center gap-1.5 truncate rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs text-red-100/75 transition hover:border-red-300/30 hover:bg-red-500/10 hover:text-red-100"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/55">
                        {link._count.visitLogs}
                      </span>
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
                          <DeleteLinkButton title={link.title} />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {links.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35">
              <Search className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-white/55">没有找到链接</p>
            <p className="mt-1 text-xs text-white/30">
              尝试更换 URL 关键词，或等待用户创建新链接。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
