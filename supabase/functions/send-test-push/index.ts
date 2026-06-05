import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  getVapid,
  jsonResponse,
  sendToSubscription,
} from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing auth token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnon) {
      throw new Error("Missing Supabase env");
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    getVapid();

    const { data: subs, error: subsError } = await userClient
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key");

    if (subsError) throw subsError;
    if (!subs?.length) {
      return jsonResponse({ error: "No push subscription on this device" }, 404);
    }

    const payload = {
      title: "Zen test",
      body: "Background push is working. You can close the app and still get reminders.",
      tag: "zen-test",
      url: "/log",
    };

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      try {
        await sendToSubscription(sub, payload);
        sent++;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    if (!sent) {
      return jsonResponse({ error: errors[0] || "Send failed" }, 500);
    }

    return jsonResponse({ ok: true, sent });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
