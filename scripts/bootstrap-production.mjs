import { spawnSync } from "node:child_process";

function run(script) {
  const result = spawnSync("node", [script], {
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

run("scripts/ensure-sqlite-schema.mjs");
run("scripts/seed-admin.mjs");
