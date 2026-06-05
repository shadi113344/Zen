import type { User } from "@supabase/supabase-js";

export function userDisplayName(user: User | null | undefined, fallback = "Account"): string {
  if (!user) return fallback;
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const fromMeta = meta?.full_name?.trim() || meta?.name?.trim();
  if (fromMeta) return fromMeta;
  const emailLocal = user.email?.split("@")[0]?.trim();
  if (emailLocal) return emailLocal;
  return fallback;
}

export function userInitial(user: User | null | undefined, fallback = "?"): string {
  const name = userDisplayName(user, "");
  return (name[0] ?? fallback).toUpperCase();
}
