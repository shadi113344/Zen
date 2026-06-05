import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapid) return { ok: false, error: "VITE_VAPID_PUBLIC_KEY not set" };
  if (!("serviceWorker" in navigator) || !supabase) {
    return { ok: false, error: "Push not available" };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }

    const json = sub.toJSON();
    if (!json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, error: "Invalid push subscription keys" };
    }
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth_key: json.keys?.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: "user_id,endpoint" },
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Subscribe failed" };
  }
}
