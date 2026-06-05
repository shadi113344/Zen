/**
 * Prints all SQL migrations in order for pasting into Supabase SQL Editor.
 * Usage: node scripts/combine-migrations.mjs > supabase/all-migrations.sql
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

for (const file of files) {
  console.log(`-- ========== ${file} ==========`);
  console.log(readFileSync(join(dir, file), "utf8").trim());
  console.log("\n");
}
