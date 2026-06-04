import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Database,
  Gauge,
  Link2,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { redirect } from "next/navigation";
import { CleanupActionButton } from "./cleanup-action-button";
import { cleanupEmptyLinks, cleanupExpiredSessions } from "./maintenance-actions";
import { IpBanDeleteButton } from "./ip-ban-buttons";
import { deleteIpBanRule, toggleIpBanRule } from "./ip-ban-actions";
import { IpBanForm } from "./ip-ban-form";

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

  if (!actor?.permissions.permRunMaintenance) {
    redirect(
      `/sys-admin?toast=${encodeURIComponent("当前管理员没有数据清理权限")}`
    );
  }

  const now = new Date();

  const [expiredSessions, emptyLinks, totalSessions, totalLinks, totalVisits, ipBanRules] =
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
      prisma.ipBanRule.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
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

      <section className="rounded-2xl border border-red-400/15 bg-red-500/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-red-200/70">
              IP Ban Rules
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-red-50">
              IP 封禁管理
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100/55">
              支持单 IP 与 CIDR 网段。为避免误封，/sys-admin 后台、超级管理员会话和普通管理员会话自动进入白名单。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100/75">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Whitelist Active
          </div>
        </div>

        <IpBanForm />

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35">
          <div className="grid grid-cols-[minmax(0,1fr)_110px_100px_150px] gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.16em] text-white/35">
            <span>规则</span>
            <span>来源</span>
            <span>状态</span>
            <span className="text-right">操作</span>
          </div>

          {ipBanRules.length > 0 ? (
            <div className="divide-y divide-white/8">
              {ipBanRules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-[minmax(0,1fr)_110px_100px_150px] items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-white/82">
                      {rule.value}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/35">
                      {rule.reason ?? "无封禁原因"}
                    </p>
                  </div>
                  <span className="text-xs text-white/45">{rule.source}</span>
                  <form
                    action={async () => {
                      "use server";
                      await toggleIpBanRule(rule.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        rule.isActive
                          ? "border-red-300/20 bg-red-500/10 text-red-100"
                          : "border-white/10 bg-white/[0.04] text-white/35"
                      }`}
                    >
                      {rule.isActive ? "启用" : "停用"}
                    </button>
                  </form>
                  <form
                    className="flex justify-end"
                    action={async () => {
                      "use server";
                      await deleteIpBanRule(rule.id);
                    }}
                  >
                    <IpBanDeleteButton value={rule.value} />
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-white/40">
              暂无 IP 封禁规则
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
