import { execFileSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const FRONTEND_PORT = 8080;
const BACKEND_PORT = 8081;

function clearPort(port) {
  if (process.platform === "win32") {
    try {
      const script = `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`;
      const output = execFileSync("powershell", ["-NoProfile", "-Command", script], {
        encoding: "utf8",
      });
      const pids = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(Number)
        .filter((pid) => Number.isInteger(pid) && pid > 0);

      for (const pid of pids) {
        try {
          execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
        } catch {
          // Port may already be free.
        }
      }
    } catch {
      // Ignore if PowerShell or the TCP query is unavailable.
    }
    return;
  }

  try {
    const output = execFileSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" });
    for (const pid of output.split(/\s+/).filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        // Ignore stale PID races.
      }
    }
  } catch {
    // lsof returns non-zero when nothing is listening.
  }
}

console.log("\nGlycoBete dev launcher");
console.log("Clearing stale processes on ports 8080 and 8081...\n");

for (const port of [FRONTEND_PORT, BACKEND_PORT]) {
  clearPort(port);
}

await sleep(500);

function run(script) {
  return spawn(npmCmd, ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

const backend = run("backend:dev");
const frontend = run("dev");

console.log("\nStarting GlycoBete:");
console.log(`  Frontend -> http://localhost:${FRONTEND_PORT}/login`);
console.log(`  Backend  -> http://localhost:${BACKEND_PORT}/health`);
console.log("  Use the frontend URL above (not Vite's default 5173).\n");

function shutdown(code = 0) {
  backend.kill();
  frontend.kill();
  process.exit(code);
}

backend.on("exit", (code) => {
  if (code && code !== 0) shutdown(code);
});

frontend.on("exit", (code) => {
  if (code && code !== 0) shutdown(code);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
