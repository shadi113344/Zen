import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { NotificationsPage } from "@/routes/NotificationsPage";
import {
  SettingsActionRow,
  SettingsLinkRow,
  SettingsPageHeader,
  SettingsSection,
  SettingsToggleRow,
  ThemeModeRow,
} from "@/components/settings/SettingsParts";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { useHapticSettings } from "@/hooks/useHapticSettings";
import { hapticGoalComplete, hapticProgressBump, isAppleTouchDevice } from "@/lib/haptic";
import { DISPLAY_DENSITY_ORDER, displayDensityLabel, type DisplayDensity } from "@/lib/display-density";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/hooks/useData";
import { useSession } from "@/hooks/useSession";
import { userDisplayName } from "@/lib/user-display";
import { useToast } from "@/components/Toast";
import {
  buildExportBundle,
  downloadJson,
  downloadText,
  logsToCsv,
  parseImportJson,
} from "@/lib/export-import";

export { NotificationsPage };

export function ProfilePage() {
  const { displayDensity, showEditButtons, setDisplayDensity, setShowEditButtons } = useDisplayPrefs();
  const {
    enabled: hapticEnabled,
    progressSteps: hapticProgressSteps,
    completion: hapticCompletion,
    setEnabled: setHapticEnabled,
    setProgressSteps: setHapticProgressSteps,
    setCompletion: setHapticCompletion,
  } = useHapticSettings();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useSession();
  const demoMode = useData().demoMode;

  const displayName = userDisplayName(user, demoMode ? "Demo User" : "Account");
  const email = user?.email ?? (demoMode ? "demo@mottazen.app" : "");

  return (
    <div className="profile-page settings-page">
      <SettingsPageHeader title="Settings" backTo="/log" backLabel="Today" />

      <section className="card profile-user settings-page__account">
        <div className="profile-user__avatar">{(displayName[0] ?? "U").toUpperCase()}</div>
        <div>
          <div className="profile-user__name">{displayName}</div>
          <div className="profile-user__email">{email}</div>
        </div>
      </section>

      <div className="settings-page__groups">
        <SettingsSection title="Today">
          <SettingsLinkRow
            to="/goals"
            title="Goals"
            hint="View, add, and edit goals with linked activities and category groups"
            meta="Open →"
          />
          <LayoutDensityRow value={displayDensity} onChange={setDisplayDensity} />
          <SettingsToggleRow
            label="Edit buttons on cards"
            hint="Show the drag handle when reordering activities"
            checked={showEditButtons}
            onChange={setShowEditButtons}
          />
        </SettingsSection>

        <SettingsSection title="Haptic feedback">
          <SettingsToggleRow
            label="Haptic feedback"
            hint="Vibration when you log progress (Android and desktop browsers with vibration support)"
            checked={hapticEnabled}
            onChange={setHapticEnabled}
          />
          <SettingsToggleRow
            label="Progress steps"
            hint="Short buzz each time you move an activity forward"
            checked={hapticProgressSteps}
            disabled={!hapticEnabled}
            onChange={setHapticProgressSteps}
          />
          <SettingsToggleRow
            label="Milestones"
            hint="Longer pattern when an activity, goal, or your day hits 100%"
            checked={hapticCompletion}
            disabled={!hapticEnabled}
            onChange={setHapticCompletion}
          />
          {isAppleTouchDevice() ? (
            <p className="settings-field__hint settings-field__hint--block">
              On iPhone and iPad, only direct taps on checkboxes and +/− controls use the system Taptic
              Engine. Milestone buzzes from the app are not available on iOS.
            </p>
          ) : (
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
          )}
        </SettingsSection>

        <SettingsSection title="Appearance">
          <ThemeModeRow value={theme} onChange={setTheme} />
          <SettingsLinkRow
            to="/profile/theme"
            title="Colors & background"
            hint="Accent, tints, glass cards"
            meta="Customize →"
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsLinkRow
            to="/profile/notifications"
            title="Coach & reminders"
            hint="Daily nudges, habit times, motivation & reviews"
            meta="Configure →"
          />
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsLinkRow
            to="/profile/data"
            title="Backup & import"
            hint="Export JSON or CSV, restore from a file"
            meta="Open →"
          />
        </SettingsSection>
      </div>

      {user ? (
        <button
          type="button"
          className="btn btn--ghost btn--block profile-signout"
          onClick={async () => {
            await signOut();
            window.location.replace("/auth");
          }}
        >
          Sign out
        </button>
      ) : null}
    </div>
  );
}

function LayoutDensityRow({
  value,
  onChange,
}: {
  value: DisplayDensity;
  onChange: (density: DisplayDensity) => void;
}) {
  return (
    <label className="profile-toggle-row profile-layout-row">
      <span>
        <span className="profile-toggle-row__label">Activity layout</span>
        <span className="profile-toggle-row__hint">Normal groups, compact rows, or activity-only</span>
      </span>
      <select
        className="profile-layout-row__select"
        value={value}
        onChange={(e) => onChange(e.target.value as DisplayDensity)}
        aria-label="Activity layout"
      >
        {DISPLAY_DENSITY_ORDER.map((density) => (
          <option key={density} value={density}>
            {displayDensityLabel(density)}
          </option>
        ))}
      </select>
    </label>
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

        <SettingsSection title="Advanced">
          <SettingsActionRow
            title="Load sample data"
            hint="90 days across Health, Mind, Movement & Life"
            onClick={loadSampleData}
          />
          <SettingsActionRow
            title="Clear all data"
            hint="Remove habits, logs, categories, and notes"
            onClick={clearAllData}
            danger
          />
        </SettingsSection>
      </div>
    </div>
  );
}
