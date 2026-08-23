const http = require("http");
const { spawn } = require("child_process");

const host = process.env.ISP_API_HOST || "127.0.0.1";
const port = Number(process.env.ISP_API_PORT || 5000);

function checkBackend() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        host,
        port,
        path: "/api/health",
        timeout: 1000,
      },
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

  const prefix = `[${name}] `;

  child.stdout.on("data", (data) => {
    process.stdout.write(
      String(data)
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => `${prefix}${line}`)
        .join("\n") + "\n"
    );
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(
      String(data)
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => `${prefix}${line}`)
        .join("\n") + "\n"
    );
  });

  return child;
}

function stop(child) {
  if (child && !child.killed) {
    child.kill("SIGTERM");
  }
}

async function main() {
  const children = [];
  const hasBackend = await checkBackend();

  if (hasBackend) {
    console.log(
      `[SERVER] ISP backend already running on http://${host}:${port}; reusing it.`
    );
  } else {
    children.push(run("SERVER", "node", ["transport-backend/server.js"]));
  }

  children.push(run("WEB", "vite", []));

  const shutdown = () => {
    for (const child of children) {
      stop(child);
    }
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });

  for (const child of children) {
    child.on("exit", (code, signal) => {
      if (signal) return;
      shutdown();
      process.exit(code || 0);
    });
  }
}

main().catch((error) => {
  console.error("[DEV] Unable to start development server:", error);
  process.exit(1);
});
