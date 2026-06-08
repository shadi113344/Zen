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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React runtime — always needed, cache separately
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }
          // Router
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run")) {
            return "router";
          }
          // Dashboard-only: framer-motion + dnd-kit land in the lazy dashboard chunk
          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }
          if (id.includes("node_modules/@dnd-kit")) {
            return "dnd";
          }
          // Lottie — only loaded when mood/streak animations render
          if (id.includes("node_modules/lottie-react") || id.includes("node_modules/lottie-web")) {
            return "lottie";
          }
          // Supabase SDK
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          // html-to-image — only used in RecapPage (lazy)
          if (id.includes("node_modules/html-to-image")) {
            return "share";
          }
        },
      },
    },
  },
});
