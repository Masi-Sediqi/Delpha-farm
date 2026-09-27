import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { networkInterfaces } from "node:os";

const networkIp = Object.values(networkInterfaces())
  .flat()
  .find((entry) => entry?.family === "IPv4" && !entry.internal)?.address || "127.0.0.1";

export default defineConfig({
  base: "./",
  cacheDir: "node_modules/.vite-afghan-power",
  plugins: [react()],
  define: {
    "globalThis.__APP_NETWORK_IP__": JSON.stringify(networkIp),
  },
  server: {
    host: "0.0.0.0",
  },
  preview: {
    host: "0.0.0.0",
  },
  build: {
    sourcemap: false
  }
});
