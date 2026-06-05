import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
export {
  ADMIN_TWO_FACTOR_CHALLENGE_COOKIE,
  adminTwoFactorChallengeMaxAge,
  createAdminTwoFactorChallengeToken,
  createTwoFactorSetupToken,
  createTwoFactorVerificationToken,
  getTwoFactorCookieOptions,
  TWO_FACTOR_COOKIE,
  TWO_FACTOR_SETUP_COOKIE,
  twoFactorCookieMaxAge,
  twoFactorSetupMaxAge,
  verifyAdminTwoFactorChallengeToken,
  verifyTwoFactorSetupToken,
} from "@/lib/two-factor-tokens";
export type {
  AdminTwoFactorChallenge,
  TwoFactorActor,
} from "@/lib/two-factor-tokens";

const BACKUP_CODE_COUNT = 10;

export type BackupCodeRecord = {
  hash: string;
  usedAt: string | null;
  encryptedCode?: string;
};

function getBaseSecret() {
  const secret =
    process.env.TWO_FACTOR_ENCRYPTION_KEY ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "TWO_FACTOR_ENCRYPTION_KEY, NEXTAUTH_SECRET, or AUTH_SECRET is required."
    );
  }

  return secret;
}

function getKey(context: string) {
  return createHash("sha256").update(`${context}:${getBaseSecret()}`).digest();
}

export function encryptTwoFactorSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey("totp-secret"), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptTwoFactorSecret(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");

  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Unsupported two-factor secret format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey("totp-secret"),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function encryptBackupCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey("backup-code"), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalizeBackupCode(code), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptBackupCode(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");

  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey("backup-code"),
      Buffer.from(ivValue, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export async function createTotpSetup(accountName: string, issuer = "LinkWeb") {
  const secret = generateSecret({ length: 20 });
  const otpAuthUrl = generateURI({
    issuer,
    label: accountName,
    secret,
    strategy: "totp",
    digits: 6,
    period: 30,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 220,
  });

  return {
    secret,
    manualSecret: secret,
    otpAuthUrl,
    qrCodeDataUrl,
  };
}

export function verifyTotpToken(secret: string, token: string) {
  const cleanToken = token.trim().replace(/\s+/g, "");

  if (!/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  const result = verifySync({
    secret,
    token: cleanToken,
    strategy: "totp",
    digits: 6,
    period: 30,
    epochTolerance: 1,
  });

  return result.valid === true;
}

function normalizeBackupCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function hashBackupCode(code: string) {
  return createHash("sha256")
    .update(`backup-code:${normalizeBackupCode(code)}:${getBaseSecret()}`)
    .digest("hex");
}

export function generateBackupCodes() {
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const raw = randomBytes(5).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });

  const records: BackupCodeRecord[] = codes.map((code) => ({
    hash: hashBackupCode(code),
    encryptedCode: encryptBackupCode(code),
    usedAt: null,
  }));

  return {
    codes,
    serialized: JSON.stringify(records),
  };
}

function parseBackupCodeRecords(serialized: string | null | undefined) {
  if (!serialized) return null;

  try {
    const records = JSON.parse(serialized) as BackupCodeRecord[];

    if (!Array.isArray(records)) return null;

    return records.filter(
      (record) =>
        typeof record?.hash === "string" &&
        ("usedAt" in record
          ? record.usedAt === null || typeof record.usedAt === "string"
          : true)
    );
  } catch {
    return null;
  }
}

export function verifyAndConsumeBackupCode(
  serialized: string | null | undefined,
  code: string
) {
  if (!serialized || !code.trim()) {
    return { valid: false, serialized };
  }

  const records = parseBackupCodeRecords(serialized);

  if (!records) {
    return { valid: false, serialized };
  }

  const hash = hashBackupCode(code);
  const index = records.findIndex(
    (record) => record.hash === hash && record.usedAt === null
  );

  if (index === -1) {
    return { valid: false, serialized };
  }

  records[index] = {
    ...records[index],
    usedAt: new Date().toISOString(),
  };

  return {
    valid: true,
    serialized: JSON.stringify(records),
  };
}

export function getBackupCodeDisplay(serialized: string | null | undefined) {
  const records = parseBackupCodeRecords(serialized) ?? [];

  return records.map((record) => ({
    code: record.encryptedCode ? decryptBackupCode(record.encryptedCode) : null,
    usedAt: record.usedAt ?? null,
  }));
}
