import type { PrismaClient } from "@prisma/client";

type HeaderReader = {
  get(name: string): string | null;
};

export function getClientIp(headers: HeaderReader) {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    headers.get("cf-connecting-ip") ??
    firstForwardedIp ??
    headers.get("x-real-ip") ??
    ""
  );
}

function ipv4ToInt(ip: string) {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }

    const octet = Number(part);
    if (octet < 0 || octet > 255) {
      return null;
    }

    value = (value << 8) + octet;
  }

  return value >>> 0;
}

export function normalizeIpBanValue(value: string) {
  return value.trim().toLowerCase();
}

export function isValidIpBanValue(value: string) {
  const normalized = normalizeIpBanValue(value);

  if (normalized.includes("/")) {
    const [ip, prefixText] = normalized.split("/");
    const prefix = Number(prefixText);

    return (
      ipv4ToInt(ip) !== null &&
      Number.isInteger(prefix) &&
      prefix >= 0 &&
      prefix <= 32
    );
  }

  return ipv4ToInt(normalized) !== null;
}

export function ipMatchesRule(ip: string, ruleValue: string) {
  const normalizedIp = normalizeIpBanValue(ip);
  const normalizedRule = normalizeIpBanValue(ruleValue);

  if (!normalizedIp || !normalizedRule) {
    return false;
  }

  if (!normalizedRule.includes("/")) {
    return normalizedIp === normalizedRule;
  }

  const [ruleIp, prefixText] = normalizedRule.split("/");
  const prefix = Number(prefixText);
  const ipInt = ipv4ToInt(normalizedIp);
  const ruleInt = ipv4ToInt(ruleIp);

  if (
    ipInt === null ||
    ruleInt === null ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 32
  ) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (ruleInt & mask);
}

export async function findMatchingIpBanRule(
  prisma: PrismaClient,
  ip: string
) {
  if (!ip) {
    return null;
  }

  const rules = await prisma.ipBanRule.findMany({
    where: { isActive: true },
    select: {
      id: true,
      value: true,
      reason: true,
      source: true,
    },
  });

  return rules.find((rule) => ipMatchesRule(ip, rule.value)) ?? null;
}
