import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase-env";

const { url, anonKey, configured } = getSupabaseEnv();

export const supabaseConfigured = configured;

export const supabase: SupabaseClient | null = configured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
