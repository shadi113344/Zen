import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  displayName: string | null;
  avatarUrl: string | null;
}

export function userDisplayName(
  user: User | null | undefined,
  fallback = "Account",
  profile?: UserProfile | null,
): string {
  if (!user) return fallback;
  const fromProfile = profile?.displayName?.trim();
  if (fromProfile) return fromProfile;
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const fromMeta = meta?.full_name?.trim() || meta?.name?.trim();
  if (fromMeta) return fromMeta;
  const emailLocal = user.email?.split("@")[0]?.trim();
  if (emailLocal) return emailLocal;
  return fallback;
}

export function userInitial(
  user: User | null | undefined,
  fallback = "?",
  profile?: UserProfile | null,
): string {
  const name = userDisplayName(user, "", profile);
  return (name[0] ?? fallback).toUpperCase();
}
