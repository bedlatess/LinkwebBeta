import { prisma } from "@/lib/prisma";
import { Activity, ShieldCheck, Users } from "lucide-react";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default async function AdminDashboardPage() {
  const [totalUsers, totalLinks, activeAdmins] = await Promise.all([
    prisma.user.count(),
    prisma.link.count(),
    prisma.adminUser.count({ where: { isActive: true } }),
  ]);

  const cards = [
    {
      label: "总注册用户",
      value: totalUsers,
      description: "当前 LinkWeb 已创建账号总量",
      icon: Users,
      accent: "text-emerald-300",
      glow: "bg-emerald-400/12",
    },
    {
      label: "总生成链接",
      value: totalLinks,
      description: "全站用户累计创建的链接数",
      icon: Activity,
      accent: "text-cyan-300",
      glow: "bg-cyan-400/12",
    },
    {
      label: "活跃管理员",
      value: activeAdmins,
      description: "仍可登录系统后台的管理员",
      icon: ShieldCheck,
      accent: "text-amber-200",
      glow: "bg-amber-300/12",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300/70">
              Admin Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              LinkWeb 系统数据大盘
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              汇总全站用户、链接资产与后台管理员状态，作为后续用户治理与系统维护模块的控制台入口。
            </p>
          </div>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200">
            Secure Admin Session Active
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.055]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/45">{card.label}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                    {numberFormatter.format(card.value)}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 ${card.glow} ${card.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/42">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
