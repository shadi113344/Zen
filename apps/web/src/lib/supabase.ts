import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isDemoMode } from "./demo-data";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = !isDemoMode;

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anon)
  : null;
