const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const host = process.env.ISP_API_HOST || "127.0.0.1";
const port = Number(process.env.ISP_API_PORT || 5000);
const backendEntry = path.join(process.cwd(), "transport-backend", "server.js");

function checkBackend() {
  return new Promise((resolve) => {
    const request = http.get(
      { host, port, path: "/api/health", timeout: 1000 },
      (response) => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 300);
      }
    );

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

function run(name, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === "win32",
    stdio: ["inherit", "pipe", "pipe"],
  });

  const write = (stream, data) => {
    const lines = String(data).split(/\r?\n/).filter(Boolean);
    if (lines.length) stream.write(lines.map((line) => `[${name}] ${line}`).join("\n") + "\n");
  };

  child.stdout.on("data", (data) => write(process.stdout, data));
  child.stderr.on("data", (data) => write(process.stderr, data));
  return child;
}

function stop(child) {
  if (child && !child.killed) child.kill("SIGTERM");
}

async function main() {
  const children = [];
  const shouldStartBackend = process.env.ISP_START_API === "true";
  const hasBackend = shouldStartBackend ? await checkBackend() : false;

  if (hasBackend) {
    console.log(`[SERVER] Reusing backend at http://${host}:${port}.`);
  } else if (shouldStartBackend && fs.existsSync(backendEntry)) {
    children.push(run("SERVER", "node", [backendEntry]));
  } else if (!shouldStartBackend) {
    console.log("[SERVER] Skipping backend; browser IndexedDB storage is active.");
  } else {
    console.warn(
      `[SERVER] No local transport-backend was included. Starting the web app only. ` +
      `Set VITE_API_ROOT to your API URL or start the API on http://${host}:${port}/api.`
    );
  }

  children.push(run("WEB", "vite", ["--host", "127.0.0.1", "--open", "http://127.0.0.1:5173/"]));

  const shutdown = () => children.forEach(stop);
  process.on("SIGINT", () => { shutdown(); process.exit(0); });
  process.on("SIGTERM", () => { shutdown(); process.exit(0); });

  children.forEach((child) => {
    child.on("exit", (code, signal) => {
      if (signal) return;
      shutdown();
      process.exit(code || 0);
    });
  });
}

main().catch((error) => {
  console.error("[DEV] Unable to start development server:", error);
  process.exit(1);
});
