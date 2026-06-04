"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import {
  getClientIp,
  ipMatchesRule,
  isValidIpBanValue,
  normalizeIpBanValue,
} from "@/lib/ip-ban";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function withToast(message: string) {
  return `/sys-admin/maintenance?toast=${encodeURIComponent(message)}`;
}

export async function createIpBanRule(formData: FormData) {
  await requireAdminActionSession("permRunMaintenance");

  const value = normalizeIpBanValue(String(formData.get("value") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!isValidIpBanValue(value)) {
    throw new Error("请输入合法 IPv4 或 CIDR，例如 1.2.3.4 或 1.2.3.0/24。");
  }

  const currentIp = getClientIp(await headers());
  if (currentIp && ipMatchesRule(currentIp, value)) {
    throw new Error(
      "这条 IP 规则会命中你当前的访问 IP，已阻止保存以避免误封自己。"
    );
  }

  await prisma.ipBanRule.upsert({
    where: { value },
    create: {
      value,
      reason,
      source: "manual",
      isActive: true,
    },
    update: {
      reason,
      source: "manual",
      isActive: true,
    },
  });

  revalidatePath("/sys-admin/maintenance");
  redirect(withToast("IP 封禁规则已保存"));
}

export async function toggleIpBanRule(ruleId: string) {
  await requireAdminActionSession("permRunMaintenance");

  const rule = await prisma.ipBanRule.findUnique({
    where: { id: ruleId },
    select: { isActive: true },
  });

  if (!rule) {
    throw new Error("IP rule not found");
  }

  await prisma.ipBanRule.update({
    where: { id: ruleId },
    data: { isActive: !rule.isActive },
  });

  revalidatePath("/sys-admin/maintenance");
  redirect(withToast(rule.isActive ? "IP 封禁规则已停用" : "IP 封禁规则已启用"));
}

export async function deleteIpBanRule(ruleId: string) {
  await requireAdminActionSession("permRunMaintenance");

  await prisma.ipBanRule.delete({
    where: { id: ruleId },
  });

  revalidatePath("/sys-admin/maintenance");
  redirect(withToast("IP 封禁规则已删除"));
}
