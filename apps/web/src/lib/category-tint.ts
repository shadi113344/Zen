import type { CSSProperties } from "react";
import { defaultCategoryPastel } from "@/lib/theme-colors";

export function categoryTintStyle(tint: string): CSSProperties {
  return { "--category-tint": tint } as CSSProperties;
}

export function resolveCategoryTint(
  category: string,
  saved: Record<string, string>,
): string {
  return saved[category] ?? defaultCategoryPastel(category);
}
