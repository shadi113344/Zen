import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { isDemoMode } from "@/lib/demo-data";
import { supabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

export function AuthPage() {
  const { session, loading, signIn, signUp, signInWithGoogle } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured || isDemoMode) {
    return (
      <div className="auth-page card">
        <AppLogo size="lg" className="auth-page__logo" />
        <h1 className="sr-only">Zen</h1>
        <p className="auth-page__demo-title">Demo mode</p>
        <p className="muted-text">
          Supabase is not configured. The app runs with sample data. Add <code>.env.local</code> with{" "}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable auth.
        </p>
        <Link to="/log" className="btn btn--primary">
          Continue to Today →
        </Link>
      </div>
    );
  }

  if (!loading && session) {
    return <Navigate to="/log" replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "signup") {
      setError("Check your email to confirm signup, then sign in.");
      setMode("signin");
      return;
    }
    navigate("/log");
  };

  const google = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card card">
        <AppLogo size="lg" className="auth-page__logo" />
        <h1 className="sr-only">Zen</h1>
        <p className="muted-text">Sign in to sync habits across devices.</p>

        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </label>
          {error && <p className="auth-form__error">{error}</p>}
          <div className="auth-page__actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={google}>
              Continue with Google
            </button>
          </div>
        </form>

        <p className="auth-page__switch">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("signup")}>
                Create account
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="auth-page__ios-note muted-text">
          On iPhone: use Share → Add to Home Screen for reliable notifications.
        </p>
      </div>
    </div>
  );
}
