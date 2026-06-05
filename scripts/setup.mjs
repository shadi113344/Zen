import { copyFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, ".env.example");
const target = join(root, "apps", "web", ".env.local");

if (existsSync(target)) {
  console.log("✓ apps/web/.env.local already exists — edit it with your Supabase keys.");
  console.log("  Then run: npm run dev");
  process.exit(0);
}

if (!existsSync(example)) {
  console.error("Missing .env.example at repo root.");
  process.exit(1);
}

copyFileSync(example, target);
console.log("Created apps/web/.env.local from .env.example");
console.log("");
console.log("Next:");
console.log("  1. Open apps/web/.env.local and paste VITE_SUPABASE_ANON_KEY");
console.log("  2. npm run dev  →  http://localhost:8787");
console.log("");
console.log("Skip keys to stay in demo mode (sample habits, no auth).");
