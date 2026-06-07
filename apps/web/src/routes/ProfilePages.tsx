import { useRef, useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { habitMilestones, todayKey } from "@mottazen/core";
import { NotificationsPage } from "@/routes/NotificationsPage";
import { MilestoneShareModal } from "@/components/share/MilestoneShareModal";
import {
  SettingsActionRow,
  SettingsLinkRow,
  SettingsPageHeader,
  SettingsSection,
  SettingsValueRow,
} from "@/components/settings/SettingsParts";
import { hapticGoalComplete, hapticProgressBump, isAppleTouchDevice } from "@/lib/haptic";
import { useData } from "@/hooks/useData";
import { useSession } from "@/hooks/useSession";
import { userDisplayName, userInitial } from "@/lib/user-display";
import { useToast } from "@/components/Toast";
import { getNotifyPermission, isStandalonePWA } from "@/lib/coach-notify";
import { clearNotifyLog } from "@/lib/notify-log";
import { supabaseConfigured } from "@/lib/supabase";
import {
  buildExportBundle,
  downloadJson,
  downloadText,
  logsToCsv,
  parseImportJson,
} from "@/lib/export-import";

export { NotificationsPage };

const DEV_UNLOCK_KEY = "zen.devUnlocked";
const DEV_TAP_TARGET = 7;

function useDevUnlock(): readonly [boolean, (next: boolean) => void] {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(DEV_UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const persist = (next: boolean) => {
    try {
      if (next) localStorage.setItem(DEV_UNLOCK_KEY, "1");
      else localStorage.removeItem(DEV_UNLOCK_KEY);
    } catch {
      /* storage unavailable — keep in-memory state only */
    }
    setUnlocked(next);
  };
  return [unlocked, persist] as const;
}

export function ProfilePage() {
  const { user, profile, signOut } = useSession();
  const data = useData();
  const { demoMode } = data;
  const { showToast } = useToast();

  const [devUnlocked, setDevUnlocked] = useDevUnlock();
  const [installOpen, setInstallOpen] = useState(false);
  const tapCount = useRef(0);
  const navigate = useNavigate();
  const [milestonePreview, setMilestonePreview] = useState<
    { streakDays: number; caption: string; habitName?: string; accent?: string } | null
  >(null);

  const openMilestonePreview = () => {
    const top = habitMilestones(data.habits, data.logs, todayKey())[0];
    if (top) {
      const habit = data.habits.find((h) => h.id === top.habitId);
      setMilestonePreview({
        streakDays: top.streakDays,
        caption: top.tier.caption,
        habitName: top.habitName,
        accent: habit?.color,
      });
    } else {
      setMilestonePreview({
        streakDays: 100,
        caption: "100 days of showing up",
        habitName: "Read",
        accent: "#22c55e",
      });
    }
  };

  const displayName = userDisplayName(user, demoMode ? "Demo User" : "Account", profile);
  const email = user?.email ?? (demoMode ? "demo@mottazen.app" : "Stored on this device");

  const status = demoMode
    ? { label: "Demo mode", color: "#f59e0b" }
    : user
      ? { label: "Synced to cloud", color: "var(--green)" }
      : { label: "Local only", color: "var(--muted)" };

  const handleVersionTap = () => {
    if (devUnlocked) return;
    tapCount.current += 1;
    const remaining = DEV_TAP_TARGET - tapCount.current;
    if (remaining <= 0) {
      tapCount.current = 0;
      setDevUnlocked(true);
      showToast("Developer options unlocked");
    } else if (remaining <= 3) {
      showToast(`${remaining} more tap${remaining === 1 ? "" : "s"} to unlock developer options`);
    }
  };

  const loadSampleData = () => {
    if (
      !window.confirm(
        "Load sample data? This replaces your current habits and logs with 90 days of demo entries.",
      )
    ) {
      return;
    }
    data.loadSampleData();
    showToast("Sample data loaded");
  };

  const clearAllData = () => {
    if (!window.confirm("Clear all data? This removes every habit, log, and setting. This cannot be undone.")) {
      return;
    }
    data.clearAllData();
    showToast("All data cleared");
  };

  return (
    <div className="profile-page settings-page">
      <SettingsPageHeader title="Settings" backTo="/log" backLabel="Today" />

      <section className="settings-group settings-account">
        <div className="settings-account__head">
          <div className="profile-user__avatar">{userInitial(user, demoMode ? "D" : "U", profile)}</div>
          <div className="settings-account__id">
            <div className="profile-user__name">{displayName}</div>
            <div className="profile-user__email">{email}</div>
            <div className="settings-account__status" style={{ "--status-dot": status.color } as CSSProperties}>
              {status.label}
            </div>
          </div>
        </div>
        {user ? (
          <SettingsLinkRow to="/profile/account" title="Profile" hint="Name, email, and password" />
        ) : null}
      </section>

      <div className="settings-page__groups">
        <SettingsSection title="General Settings">
          <SettingsLinkRow
            to="/profile/theme"
            title="Appearance"
            hint="Theme, accent, background, glass & category colors"
          />
          <SettingsLinkRow
            to="/profile/notifications"
            title="Notifications"
            hint="Coach nudges, habit times, motivation & reviews"
          />
          <SettingsLinkRow
            to="/profile/haptics"
            title="Haptics"
            hint="Vibration for progress steps and milestones"
          />
          <SettingsLinkRow
            to="/profile/data"
            title="Data"
            hint="Export JSON or CSV, restore from a file"
          />
        </SettingsSection>

        <SettingsSection title="About">
          {!isStandalonePWA() ? (
            <>
              <SettingsActionRow
                title="Install app"
                hint="Full-screen, offline access, background reminders"
                meta={installOpen ? "▾" : "▸"}
                onClick={() => setInstallOpen((v) => !v)}
              />
              {installOpen ? (
                <p className="settings-field__hint settings-field__hint--block">
                  <strong>iPhone/iPad:</strong> Safari → Share → Add to Home Screen.
                  <br />
                  <strong>Android:</strong> Chrome menu → Install app or Add to Home screen.
                  <br />
                  <strong>Desktop:</strong> Chrome/Edge address bar → Install Zen.
                </p>
              ) : null}
            </>
          ) : null}
          <SettingsActionRow
            title="Version"
            hint={devUnlocked ? "Developer options unlocked" : undefined}
            meta={__APP_VERSION__}
            onClick={handleVersionTap}
          />
        </SettingsSection>

        {devUnlocked ? (
          <SettingsSection title="Developer">
            <SettingsValueRow label="App version" value={__APP_VERSION__} mono />
            <SettingsValueRow label="Supabase configured" value={supabaseConfigured ? "Yes" : "No"} />
            <SettingsValueRow label="VAPID push key" value={import.meta.env.VITE_VAPID_PUBLIC_KEY ? "Yes" : "No"} />
            <SettingsValueRow label="Notification permission" value={getNotifyPermission()} />
            <SettingsValueRow label="Standalone PWA" value={isStandalonePWA() ? "Yes" : "No"} />
            <SettingsValueRow label="Demo mode" value={demoMode ? "Yes" : "No"} />
            <SettingsValueRow label="Timezone" value={data.timezone} mono />
            <SettingsActionRow
              title="Load sample data"
              hint="~400 days across Health, Mind, Movement & Life (perfect-streak Read)"
              onClick={loadSampleData}
            />
            <SettingsActionRow
              title="Preview milestone card"
              hint="Open the shareable card for your best streak (G2)"
              onClick={openMilestonePreview}
            />
            <SettingsActionRow
              title="Open year recap"
              hint="Animated Wrapped-style recap from your logs (G3)"
              onClick={() => navigate("/recap/year")}
            />
            <SettingsActionRow
              title="Reset today's sent log"
              hint="Clear the notification de-dupe log for today"
              onClick={() => {
                clearNotifyLog();
                showToast("Today's sent log reset");
              }}
            />
            <SettingsActionRow
              title="Clear all data"
              hint="Remove habits, logs, categories, and notes"
              onClick={clearAllData}
              danger
            />
            {!isAppleTouchDevice() ? (
              <>
                <SettingsActionRow
                  title="Test progress buzz"
                  hint="Preview the short step vibration"
                  onClick={() => hapticProgressBump({ force: true })}
                />
                <SettingsActionRow
                  title="Test milestone buzz"
                  hint="Preview the longer completion pattern"
                  onClick={() => hapticGoalComplete({ force: true })}
                />
              </>
            ) : null}
            <SettingsActionRow
              title="Hide developer options"
              hint="Re-lock this section"
              onClick={() => {
                setDevUnlocked(false);
                showToast("Developer options hidden");
              }}
            />
          </SettingsSection>
        ) : null}
      </div>

      {milestonePreview ? (
        <MilestoneShareModal
          open
          onClose={() => setMilestonePreview(null)}
          streakDays={milestonePreview.streakDays}
          caption={milestonePreview.caption}
          habitName={milestonePreview.habitName}
          accent={milestonePreview.accent}
        />
      ) : null}

      {user ? (
        <div className="settings-sign-out">
          <button
            type="button"
            className="settings-sign-out__btn"
            onClick={async () => {
              await signOut();
              window.location.replace("/auth");
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated merged into main settings — redirects home */
export function ProfileDisplayPage() {
  return <Navigate to="/profile" replace />;
}

export function ProfileDataPage() {
  const data = useData();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportJson = () => {
    const bundle = buildExportBundle({
      habits: data.habits,
      logs: data.logs,
      categoryWeights: data.categoryWeights,
      categoryColors: data.categoryColors,
      dailyNotes: data.dailyNotes,
      notificationSettings: data.notificationSettings,
      timezone: data.timezone,
      goals: data.goals,
      goalHabits: data.goalHabits,
      tasks: data.tasks,
    });
    downloadJson(`mottazen-export-${new Date().toISOString().slice(0, 10)}.json`, bundle);
  };

  const exportCsv = () => {
    downloadText(
      `mottazen-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      logsToCsv(data.logs, data.habits),
      "text/csv",
    );
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = parseImportJson(String(reader.result));
        const legacy = !(JSON.parse(String(reader.result)) as { version?: number }).version;
        setPreview(`${legacy ? "Legacy → " : ""}${bundle.habits.length} habits, ${bundle.logs.length} logs`);
        setError(null);
        (fileRef.current as HTMLInputElement & { _bundle?: typeof bundle })._bundle = bundle;
      } catch (e) {
        setPreview(null);
        setError(e instanceof Error ? e.message : "Invalid file");
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const input = fileRef.current as HTMLInputElement & { _bundle?: ReturnType<typeof parseImportJson> };
    if (!input?._bundle) return;
    if (!window.confirm("Replace local data with this import? Current session data will be overwritten.")) return;
    data.importBundle(input._bundle);
    setPreview("Import applied.");
    showToast("Import complete");
  };

  return (
    <div className="profile-page settings-page">
      <SettingsPageHeader title="Data" backTo="/profile" backLabel="Settings" />

      <div className="settings-page__groups">
        <SettingsSection title="Export">
          <SettingsActionRow title="Download JSON backup" hint="Full app snapshot: habits, logs, notes, settings" onClick={exportJson} />
          <SettingsActionRow title="Download CSV (logs)" hint="Spreadsheet-friendly log history" onClick={exportCsv} />
        </SettingsSection>

        <SettingsSection title="Import">
          <p className="settings-page__intro muted-text">
            Restore from a JSON export from Zen or the legacy habit tracker.
          </p>
          <label className="settings-file-field">
            <span className="settings-file-field__label">Choose file</span>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>
          {preview ? <p className="settings-import-preview">{preview}</p> : null}
          {error ? <p className="auth-form__error">{error}</p> : null}
          {preview && !error ? (
            <button type="button" className="btn btn--primary btn--block settings-import-confirm" onClick={confirmImport}>
              Confirm import
            </button>
          ) : null}
        </SettingsSection>

        <p className="settings-page__intro muted-text">
          Looking for sample data or a full reset? Those live under Settings → About → tap Version to
          reveal Developer options.
        </p>
      </div>
    </div>
  );
}
