const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "release");
const unpackedDir = path.join(releaseDir, "win-unpacked");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function removePath(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 500,
  });
}

function cleanReleaseArtifacts() {
  fs.mkdirSync(releaseDir, {
    recursive: true,
  });

  for (const entry of fs.readdirSync(releaseDir)) {
    const target = path.join(releaseDir, entry);
    removePath(target);
  }
}

function keepOnlyInstaller() {
  removePath(unpackedDir);

  for (const entry of fs.readdirSync(releaseDir)) {
    const target = path.join(releaseDir, entry);
    const isInstaller =
      /^APG-Medicine-Setup-\d+\.\d+\.\d+\.exe$/i.test(entry);

    if (!isInstaller) {
      removePath(target);
    }
  }
}

cleanReleaseArtifacts();
run("npm", ["run", "build:web"]);
run("node", [
  "./node_modules/electron-builder/cli.js",
  "--win",
  "--x64",
]);
keepOnlyInstaller();

console.log("Installer build completed. release contains only the setup exe.");
