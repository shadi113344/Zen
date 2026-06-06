import { useEffect, useState } from "react";
import { SettingsPageHeader, SettingsSection } from "@/components/settings/SettingsParts";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/components/Toast";
import { isPasswordAuthUser, userAuthProvider, userDisplayName } from "@/lib/user-display";

export function ProfileAccountPage() {
  const { user, profile, updateDisplayName, updateEmail, sendPasswordReset } = useSession();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordAuth = isPasswordAuthUser(user);
  const provider = userAuthProvider(user);

  useEffect(() => {
    setName(userDisplayName(user, "", profile));
    setEmail(user?.email ?? "");
  }, [user, profile]);

  const saveName = async () => {
    setNameBusy(true);
    setNameError(null);
    const result = await updateDisplayName(name);
    setNameBusy(false);
    if (result.error) {
      setNameError(result.error);
      return;
    }
    showToast("Display name updated");
  };

  const saveEmail = async () => {
    setEmailBusy(true);
    setEmailError(null);
    const result = await updateEmail(email);
    setEmailBusy(false);
    if (result.error) {
      setEmailError(result.error);
      return;
    }
    showToast("Check your inbox to confirm the new email");
  };

  const sendReset = async () => {
    if (!user?.email) return;
    setPasswordError(null);
    setResetBusy(true);
    const result = await sendPasswordReset(user.email);
    setResetBusy(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setResetSent(true);
    showToast("Password reset link sent");
  };

  if (!user) {
    return (
      <div className="profile-page settings-page">
        <SettingsPageHeader title="Profile" backTo="/profile" backLabel="Settings" />
        <p className="settings-page__intro muted-text">Sign in to manage your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-page settings-page">
      <SettingsPageHeader title="Profile" backTo="/profile" backLabel="Settings" />

      <div className="settings-page__groups">
        <SettingsSection title="Display name">
          <div className="settings-field">
            <label className="field">
              <span className="settings-field__label">Name</span>
              <span className="settings-field__hint">Shown in the header and settings</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={80}
              />
            </label>
            {nameError ? <p className="auth-form__error">{nameError}</p> : null}
            <button type="button" className="btn btn--primary btn--block settings-account__save" onClick={saveName} disabled={nameBusy}>
              {nameBusy ? "Saving…" : "Save name"}
            </button>
          </div>
        </SettingsSection>

        <SettingsSection title="Email">
          {passwordAuth ? (
            <div className="settings-field">
              <label className="field">
                <span className="settings-field__label">Email address</span>
                <span className="settings-field__hint">We will send a confirmation link to the new address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              {emailError ? <p className="auth-form__error">{emailError}</p> : null}
              <button
                type="button"
                className="btn btn--primary btn--block settings-account__save"
                onClick={saveEmail}
                disabled={emailBusy || email === user.email}
              >
                {emailBusy ? "Saving…" : "Update email"}
              </button>
            </div>
          ) : (
            <p className="settings-field__hint settings-field__hint--block">
              Signed in with {provider === "google" ? "Google" : provider ?? "your provider"}. Your email (
              {user.email}) is managed by that account and cannot be changed here.
            </p>
          )}
        </SettingsSection>

        <SettingsSection title="Password">
          {passwordAuth ? (
            <div className="settings-field">
              <span className="settings-field__hint settings-field__hint--block">
                For your security, passwords are changed via a reset link. We will email{" "}
                <strong>{user.email}</strong> a secure link to set a new password.
              </span>
              {passwordError ? <p className="auth-form__error">{passwordError}</p> : null}
              {resetSent ? (
                <p className="settings-field__hint settings-field__hint--block">
                  Link sent. Check your inbox (and spam) for the reset email — it expires after a while, so
                  use it soon.
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn--primary btn--block settings-account__save"
                onClick={sendReset}
                disabled={resetBusy || !user.email}
              >
                {resetBusy ? "Sending…" : resetSent ? "Resend reset link" : "Send password reset link"}
              </button>
            </div>
          ) : (
            <p className="settings-field__hint settings-field__hint--block">
              Password sign-in is not enabled for {provider === "google" ? "Google" : provider ?? "OAuth"}{" "}
              accounts. Continue using {provider === "google" ? "Google" : "your provider"} to sign in.
            </p>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}
