import { getSupabaseEnv } from "@/lib/supabase-env";
import { supabase } from "@/lib/supabase";

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const { url, configured } = getSupabaseEnv();
  if (!configured || !url || !supabase) {
    return { ok: false, error: "Supabase not configured" };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { ok: false, error: "Sign in to test background push" };

  try {
    const res = await fetch(`${url}/functions/v1/send-test-push`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
    if (!res.ok) return { ok: false, error: body.error ?? `Request failed (${res.status})` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Test push failed" };
  }
}
