import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { isDemoMode } from "@/lib/demo-data";
import { supabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

export function AuthPage() {
  const { session, loading, signIn, signUp, signInWithGoogle, sendPasswordReset } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
    setNotice(null);

    if (mode === "reset") {
      const result = await sendPasswordReset(email);
      setBusy(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice("If an account exists for that email, a reset link is on its way. Check your inbox.");
      return;
    }

    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "signup") {
      setNotice("Check your email to confirm signup, then sign in.");
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

  const switchMode = (next: "signin" | "signup" | "reset") => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card card">
        <AppLogo size="lg" className="auth-page__logo" />
        <h1 className="sr-only">Zen</h1>
        <p className="muted-text">
          {mode === "reset"
            ? "Enter your email and we'll send you a link to reset your password."
            : "Sign in to sync habits across devices."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              inputMode="email"
            />
          </label>
          {mode !== "reset" && (
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </label>
          )}
          {mode === "signin" && (
            <button type="button" className="link-btn auth-page__forgot" onClick={() => switchMode("reset")}>
              Forgot password?
            </button>
          )}
          {error && <p className="auth-form__error">{error}</p>}
          {notice && <p className="auth-form__notice">{notice}</p>}
          <div className="auth-page__actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy
                ? "…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
            </button>
            {mode !== "reset" && (
              <button type="button" className="btn btn--ghost btn--block" onClick={google}>
                Continue with Google
              </button>
            )}
          </div>
        </form>

        <p className="auth-page__switch">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("signup")}>
                Create account
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Have an account?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Remembered it?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
                Back to sign in
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
