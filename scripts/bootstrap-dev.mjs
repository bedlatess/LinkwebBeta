import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env");
const envExamplePath = join(root, ".env.example");
const shouldSeed = process.argv.includes("--seed");

function normalizeEnvValue(text, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}="${value}"`;
  return pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
}

function getEnvValue(text, key) {
  const match = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match?.[1]?.trim().replace(/^"|"$/g, "") ?? "";
}

function isLocalSqliteDatabase(databaseUrl) {
  return databaseUrl === "" || databaseUrl.startsWith("file:");
}

function ensureLocalEnv() {
  const hadEnv = existsSync(envPath);
  let env = "";

  if (hadEnv) {
    env = readFileSync(envPath, "utf8");
  } else if (existsSync(envExamplePath)) {
    env = readFileSync(envExamplePath, "utf8");
  }

  if (!env.includes("DATABASE_URL=")) {
    env = `${env.trimEnd()}\nDATABASE_URL="file:./dev.db"\n`;
  }

  if (!env.includes("NEXTAUTH_URL=")) {
    env = `${env.trimEnd()}\nNEXTAUTH_URL="http://localhost:2222"\n`;
  }

  if (
    !env.includes("NEXTAUTH_SECRET=") ||
    env.includes("your-secret-here-generate-with-openssl-rand-base64-32")
  ) {
    env = normalizeEnvValue(
      env,
      "NEXTAUTH_SECRET",
      randomBytes(32).toString("base64")
    );
  }

  if (!hadEnv) {
    env = normalizeEnvValue(env, "NEXTAUTH_URL", "http://localhost:2222");
    env = env
      .replace(/^GITHUB_CLIENT_ID="your-github-client-id"$/m, 'GITHUB_CLIENT_ID=""')
      .replace(/^GITHUB_SECRET="your-github-client-secret"$/m, 'GITHUB_SECRET=""')
      .replace(/^GOOGLE_CLIENT_ID="your-google-client-id"$/m, 'GOOGLE_CLIENT_ID=""')
      .replace(/^GOOGLE_SECRET="your-google-client-secret"$/m, 'GOOGLE_SECRET=""');
  }

  writeFileSync(envPath, env, "utf8");
  return env;
}

function run(command, args) {
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const finalArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", command, ...args]
      : args;
  const result = spawnSync(executable, finalArgs, {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(result.error);
    }
    process.exit(result.status ?? 1);
  }
}

function tryRun(command, args) {
  const executable = process.platform === "win32" ? "cmd.exe" : command;
  const finalArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", command, ...args]
      : args;
  const result = spawnSync(executable, finalArgs, {
    cwd: root,
    shell: false,
    stdio: "inherit",
  });
  return result.status === 0;
}

const env = ensureLocalEnv();
const databaseUrl = getEnvValue(env, "DATABASE_URL");

if (!existsSync(join(root, "node_modules", ".prisma", "client"))) {
  run("npx", ["prisma", "generate"]);
}

if (isLocalSqliteDatabase(databaseUrl)) {
  run("node", ["scripts/ensure-sqlite-schema.mjs"]);
} else if (!tryRun("npx", ["prisma", "migrate", "deploy"])) {
  console.warn(
    "Prisma migrate deploy failed; falling back to direct SQLite schema sync."
  );
  run("node", ["scripts/ensure-sqlite-schema.mjs"]);
}

if (shouldSeed || isLocalSqliteDatabase(databaseUrl)) {
  run("npx", ["prisma", "db", "seed"]);
}
