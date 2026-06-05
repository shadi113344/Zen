import { useEffect, useState } from "react";
import { SettingsPageHeader, SettingsSection } from "@/components/settings/SettingsParts";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/components/Toast";
import { isPasswordAuthUser, userAuthProvider, userDisplayName } from "@/lib/user-display";

export function ProfileAccountPage() {
  const { user, profile, updateDisplayName, updateEmail, updatePassword } = useSession();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
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

  const savePassword = async () => {
    setPasswordError(null);
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordBusy(true);
    const result = await updatePassword(password);
    setPasswordBusy(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    showToast("Password updated");
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
              <label className="field">
                <span className="settings-field__label">New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </label>
              <label className="field">
                <span className="settings-field__label">Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </label>
              {passwordError ? <p className="auth-form__error">{passwordError}</p> : null}
              <button
                type="button"
                className="btn btn--primary btn--block settings-account__save"
                onClick={savePassword}
                disabled={passwordBusy || !password}
              >
                {passwordBusy ? "Saving…" : "Update password"}
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
