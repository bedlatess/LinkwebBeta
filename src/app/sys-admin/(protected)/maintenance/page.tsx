import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Database,
  Gauge,
  Link2,
  ShieldAlert,
  TimerReset,
} from "lucide-react";
import { notFound } from "next/navigation";
import { CleanupActionButton } from "./cleanup-action-button";
import { cleanupEmptyLinks, cleanupExpiredSessions } from "./maintenance-actions";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Database;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/15 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/42">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {numberFormatter.format(value)}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function DangerCard({
  title,
  description,
  count,
  buttonLabel,
  confirmText,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  count: number;
  buttonLabel: string;
  confirmText: string;
  action: () => Promise<void>;
  icon: typeof TimerReset;
}) {
  return (
    <section className="rounded-2xl border border-red-400/15 bg-red-500/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/20 bg-red-400/12 text-red-200">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-100">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-red-100/52">
              {description}
            </p>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
              当前可清理：{numberFormatter.format(count)}
            </p>
          </div>
        </div>

        <form action={action}>
          <CleanupActionButton
            label={buttonLabel}
            confirmText={confirmText}
            disabled={count === 0}
          />
        </form>
      </div>
    </section>
  );
}

export default async function AdminMaintenancePage() {
  const actor = await getAdminActor();

  if (!actor?.permissions.permManageUsers) {
    notFound();
  }

  const now = new Date();

  const [expiredSessions, emptyLinks, totalSessions, totalLinks, totalVisits] =
    await Promise.all([
      prisma.session.count({ where: { expires: { lt: now } } }),
      prisma.link.count({
        where: {
          OR: [
            { title: "" },
            { url: "" },
            { title: { equals: "" } },
            { url: { equals: "" } },
          ],
        },
      }),
      prisma.session.count(),
      prisma.link.count(),
      prisma.visitLog.count(),
    ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-200/70">
              Data Cleanup
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              系统清理与优化
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              这里用于处理内部数据垃圾；站点维护模式仍在“全局设置”中作为外部流量闸门控制。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100/75">
            <ShieldAlert className="h-3.5 w-3.5" />
            Dangerous Operations
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="普通用户 Session"
          value={totalSessions}
          icon={Database}
          tone="bg-cyan-400/12 text-cyan-200"
        />
        <StatCard
          label="全站链接资产"
          value={totalLinks}
          icon={Link2}
          tone="bg-emerald-400/12 text-emerald-200"
        />
        <StatCard
          label="累计访问日志"
          value={totalVisits}
          icon={Activity}
          tone="bg-amber-300/12 text-amber-100"
        />
      </section>

      <section className="grid gap-4">
        <DangerCard
          title="清理过期会话"
          description="删除 expires 早于当前时间的普通用户 Session，释放认证表垃圾数据，不影响仍有效的登录状态。"
          count={expiredSessions}
          buttonLabel="清理过期会话"
          confirmText="确认清理所有过期普通用户 Session 吗？此操作不可撤销。"
          action={cleanupExpiredSessions}
          icon={TimerReset}
        />
        <DangerCard
          title="清理空链接"
          description="删除标题或 URL 为空的僵尸 Link 记录，避免后台统计和公开页面被无效资产污染。"
          count={emptyLinks}
          buttonLabel="清理空链接"
          confirmText="确认删除所有空标题或空 URL 的僵尸链接吗？此操作会物理删除记录。"
          action={cleanupEmptyLinks}
          icon={Gauge}
        />
      </section>
    </div>
  );
}
