import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isDemoMode } from "@/lib/demo-data";
import { clearAllLocalSnapshots } from "@/lib/local-data-store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { UserProfile } from "@/lib/user-display";

interface SessionContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<{ error: string | null }>;
  updateEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !supabase) {
      setProfile(null);
      return;
    }

    void supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile({
          displayName: (data?.display_name as string | null) ?? null,
          avatarUrl: (data?.avatar_url as string | null) ?? null,
        });
      });
  }, [session?.user?.id]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/log` },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    clearAllLocalSnapshots();
    try {
      localStorage.removeItem("demo_notification_prefs");
      localStorage.removeItem("demo_timezone");
      localStorage.removeItem("demo_category_colors");
      sessionStorage.removeItem("mottazen-app-date");
      if (supabase) await supabase.auth.signOut({ scope: "global" });
    } catch {
      /* ignore */
    }
    setSession(null);
    setProfile(null);
  };

  const updateDisplayName = async (displayName: string) => {
    const userId = session?.user?.id;
    if (!userId || !supabase) return { error: "Not signed in" };
    const trimmed = displayName.trim();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: trimmed || null,
    });
    if (!error) {
      setProfile((prev) => ({
        displayName: trimmed || null,
        avatarUrl: prev?.avatarUrl ?? null,
      }));
    }
    return { error: error?.message ?? null };
  };

  const updateEmail = async (email: string) => {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  return (
    <SessionContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateDisplayName,
        updateEmail,
        updatePassword,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export function useRequireAuth(): boolean {
  return supabaseConfigured && !isDemoMode;
}
