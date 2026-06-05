import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 8787,
    strictPort: true,
    /** Listen on LAN + Tailscale (0.0.0.0) — use `npm run dev` from repo root */
    host: true,
  },
  preview: {
    port: 8787,
    strictPort: true,
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@mottazen/core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },
  build: {
    outDir: "dist",
  },
});
