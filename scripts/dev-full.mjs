import { spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(script) {
  return spawn(npmCmd, ["run", script], {
    stdio: "inherit",
    shell: true,
  });
}

const backend = run("backend:dev");
const frontend = run("dev");

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
