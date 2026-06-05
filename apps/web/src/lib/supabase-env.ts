function trimEnv(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSupabaseEnv() {
  const url = trimEnv(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const validUrl = url.startsWith("http://") || url.startsWith("https://");
  return { url, anonKey, configured: validUrl && anonKey.length > 0 };
}
