import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(result.error);
    }
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("node", ["scripts/ensure-sqlite-schema.mjs"]);
run("node", ["scripts/seed-admin.mjs"]);
