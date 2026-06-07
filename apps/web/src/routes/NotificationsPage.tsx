import { mergeHabitNotify, uniqueCategories } from "@mottazen/core";
import type { Habit, HabitNotifySettings, NotificationSettings } from "@mottazen/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  coachNotify,
  defaultTimezone,
  getNotifyPermission,
  isIOS,
  isStandalonePWA,
  requestNotifyPermission,
} from "@/lib/coach-notify";
import { clearNotifyLog } from "@/lib/notify-log";
import { GlassSelect } from "@/components/GlassSelect";
import { NumericInput } from "@/components/NumericInput";
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/settings/SettingsParts";
import { useNotifications } from "@/hooks/useData";
import { useSession } from "@/hooks/useSession";
import { subscribeToPush } from "@/lib/push-subscribe";
import { sendTestPush } from "@/lib/push-test";
import { useToast } from "@/components/Toast";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function NotificationsPage() {
  const location = useLocation();
  const { user } = useSession();
  const { showToast } = useToast();
  const { notificationSettings, timezone, saveNotificationSettings, habits, updateHabit } = useNotifications();
  const vapidConfigured = !!import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const [draft, setDraft] = useState<NotificationSettings>(notificationSettings);
  const [tz, setTz] = useState(timezone);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [permission, setPermission] = useState(getNotifyPermission());

  useEffect(() => {
    const habitId = (location.state as { habitId?: string } | null)?.habitId;
    if (habitId) setExpanded(habitId);
  }, [location.state]);

  useEffect(() => {
    setDraft(notificationSettings);
    setTz(timezone);
    setDirty(false);
  }, [notificationSettings, timezone]);

  const categories = useMemo(() => uniqueCategories(habits), [habits]);

  useEffect(() => {
    setDraft((prev) => {
      const existing = new Map(prev.categoryRules.map((r) => [r.category, r]));
      const rules = categories.map((category) => existing.get(category) ?? { category, enabled: false, time: "18:00" });
      return { ...prev, categoryRules: rules };
    });
  }, [categories.join("|")]);

  const patch = (partial: Partial<NotificationSettings>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    saveNotificationSettings(draft, tz);
    setDirty(false);
    setSaved(true);
    if (draft.enabled && user?.id && vapidConfigured) {
      const result = await subscribeToPush(user.id);
      if (!result.ok) showToast(`Push subscribe failed: ${result.error}`);
    }
    window.setTimeout(() => setSaved(false), 2000);
  };

  const handleTestPush = async () => {
    const result = await sendTestPush();
    if (result.ok) showToast("Background test push sent");
    else showToast(result.error ?? "Test push failed");
  };

  const handleEnablePermission = async () => {
    const result = await requestNotifyPermission();
    setPermission(result);
    if (result === "granted") {
      patch({ enabled: true });
      coachNotify({ title: "Coach enabled", body: "Reminders will appear while the app is open.", tag: "coach-test" });
    }
  };

  const handleTest = () => {
    coachNotify({
      title: "Test reminder",
      body: draft.tone === "gentle" ? "This is how gentle nudges will sound." : "This is a direct coach ping.",
      tag: "coach-test",
    });
  };

  return (
    <div className="coach-page settings-page">
      <SettingsPageHeader title="Notifications" />

      {isIOS() && !isStandalonePWA() && (
        <div className="coach-ios-note card">
          <strong>iPhone tip:</strong> Add Zen to your Home Screen for more reliable reminders. Safari → Share → Add to
          Home Screen.
        </div>
      )}

      <div className="settings-page__groups">
        <SettingsSection title="General">
          <SettingsToggleRow
            label="Enable coach notifications"
            hint="Foreground reminders while open, plus background push when VAPID is configured and you save settings."
            checked={draft.enabled}
            onChange={(enabled) => patch({ enabled })}
          />
          <div className="coach-permission">
            <span className="coach-permission__status">Browser permission: {permission}</span>
            {permission !== "granted" && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => void handleEnablePermission()}>
                Allow notifications
              </button>
            )}
            {permission === "granted" && (
              <>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleTest}>
                  Test in app
                </button>
                {vapidConfigured && user ? (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => void handleTestPush()}>
                    Test push
                  </button>
                ) : null}
              </>
            )}
          </div>
          <FieldRow label="Timezone">
            <input
              className="coach-input"
              value={tz}
              onChange={(e) => {
                setTz(e.target.value);
                setDirty(true);
              }}
              list="tz-list"
            />
            <datalist id="tz-list">
              <option value={defaultTimezone()} />
              <option value="UTC" />
              <option value="America/New_York" />
              <option value="America/Los_Angeles" />
              <option value="Europe/London" />
            </datalist>
          </FieldRow>
          <FieldRow label="Quiet hours">
            <div className="coach-time-range">
              <input
                type="time"
                className="coach-input"
                value={draft.quietHours.start}
                onChange={(e) => patch({ quietHours: { ...draft.quietHours, start: e.target.value } })}
              />
              <span className="coach-time-range__sep">to</span>
              <input
                type="time"
                className="coach-input"
                value={draft.quietHours.end}
                onChange={(e) => patch({ quietHours: { ...draft.quietHours, end: e.target.value } })}
              />
            </div>
          </FieldRow>
          <FieldRow label="Max notifications per day">
            <NumericInput
              className="coach-input coach-input--narrow"
              value={draft.maxPerDay}
              onChange={(e) => patch({ maxPerDay: Number(e.target.value) })}
            />
          </FieldRow>
          <FieldRow label="Tone">
            <GlassSelect
              className="coach-input"
              value={draft.tone}
              onChange={(tone) => patch({ tone })}
              aria-label="Notification tone"
              options={[
                { value: "gentle", label: "Gentle" },
                { value: "direct", label: "Direct" },
              ]}
            />
          </FieldRow>
          <SettingsToggleRow
            label="Vacation mode"
            hint="Pause all coach notifications."
            checked={draft.vacationMode}
            onChange={(vacationMode) => patch({ vacationMode })}
          />
        </SettingsSection>

        <SettingsSection title="Daily check-in">
          <SettingsToggleRow
            label="End-of-day summary"
            checked={draft.dailyCheckIn.enabled}
            onChange={(enabled) => patch({ dailyCheckIn: { ...draft.dailyCheckIn, enabled } })}
          />
          <FieldRow label="Time">
            <input
              type="time"
              className="coach-input"
              value={draft.dailyCheckIn.time}
              onChange={(e) => patch({ dailyCheckIn: { ...draft.dailyCheckIn, time: e.target.value } })}
            />
          </FieldRow>
        </SettingsSection>

        <SettingsSection title="Activity reminders">
          <p className="coach-section__intro">Set a reminder time per habit. Expand a row for days, custom message, and missed alerts.</p>
          {habits.filter((h) => !h.paused).length === 0 ? (
            <p className="coach-section__empty">Add activities on Today to configure reminders.</p>
          ) : (
            <ul className="coach-habit-list">
              {habits
                .filter((h) => !h.paused)
                .map((habit) => (
                  <HabitReminderRow
                    key={habit.id}
                    habit={habit}
                    expanded={expanded === habit.id}
                    onToggle={() => setExpanded((id) => (id === habit.id ? null : habit.id))}
                    onChange={(next) => {
                      updateHabit(next);
                      setDirty(true);
                    }}
                  />
                ))}
            </ul>
          )}
        </SettingsSection>

        <SettingsSection title="Smart missed">
          <SettingsToggleRow
            label="Follow-up if a habit is still unlogged"
            checked={draft.smartMissed.enabled}
            onChange={(enabled) => patch({ smartMissed: { ...draft.smartMissed, enabled } })}
          />
          <FieldRow label="Delay after reminder (minutes)">
            <NumericInput
              className="coach-input coach-input--narrow"
              value={draft.smartMissed.delayMinutes}
              onChange={(e) => patch({ smartMissed: { ...draft.smartMissed, delayMinutes: Number(e.target.value) } })}
            />
          </FieldRow>
        </SettingsSection>

        <SettingsSection title="Advanced">
          <SettingsToggleRow
            label="Motivation on log"
            hint="Short encouragement after you log a habit."
            checked={draft.motivation.enabled}
            onChange={(enabled) => patch({ motivation: { enabled } })}
          />
          <SettingsToggleRow
            label="Recovery nudge"
            hint="Morning message after a low-scoring day."
            checked={draft.recovery.enabled}
            onChange={(enabled) => patch({ recovery: { enabled } })}
          />
          <SettingsToggleRow
            label="Low score alert"
            checked={draft.lowScore.enabled}
            onChange={(enabled) => patch({ lowScore: { ...draft.lowScore, enabled } })}
          />
          <FieldRow label="Low score threshold (%)">
            <NumericInput
              className="coach-input coach-input--narrow"
              value={draft.lowScore.threshold}
              onChange={(e) => patch({ lowScore: { ...draft.lowScore, threshold: Number(e.target.value) } })}
            />
          </FieldRow>
          <SettingsToggleRow
            label="Evening reflection"
            checked={draft.reflection.enabled}
            onChange={(enabled) => patch({ reflection: { ...draft.reflection, enabled } })}
          />
          <FieldRow label="Reflection time">
            <input
              type="time"
              className="coach-input"
              value={draft.reflection.time}
              onChange={(e) => patch({ reflection: { ...draft.reflection, time: e.target.value } })}
            />
          </FieldRow>

          {draft.categoryRules.length > 0 && (
            <>
              <h3 className="coach-section__subtitle">Life area rules</h3>
              {draft.categoryRules.map((rule, index) => (
                <div key={rule.category} className="coach-category-rule">
                  <SettingsToggleRow
                    label={rule.category}
                    checked={rule.enabled}
                    onChange={(enabled) => {
                      const categoryRules = [...draft.categoryRules];
                      categoryRules[index] = { ...rule, enabled };
                      patch({ categoryRules });
                    }}
                  />
                  {rule.enabled && (
                    <FieldRow label="Reminder time">
                      <input
                        type="time"
                        className="coach-input"
                        value={rule.time ?? "18:00"}
                        onChange={(e) => {
                          const categoryRules = [...draft.categoryRules];
                          categoryRules[index] = { ...rule, time: e.target.value };
                          patch({ categoryRules });
                        }}
                      />
                    </FieldRow>
                  )}
                </div>
              ))}
            </>
          )}
        </SettingsSection>
      </div>

      <div className="coach-sticky-save">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => clearNotifyLog()}>
          Reset today&apos;s sent log
        </button>
        <button type="button" className="btn btn--primary" disabled={!dirty} onClick={handleSave}>
          {saved ? "Saved" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="settings-field coach-field">
      <span className="settings-field__label">{label}</span>
      <div className="coach-field__control">{children}</div>
    </div>
  );
}

function HabitReminderRow({
  habit,
  expanded,
  onToggle,
  onChange,
}: {
  habit: Habit;
  expanded: boolean;
  onToggle: () => void;
  onChange: (habit: Habit) => void;
}) {
  const notify = habit.notify ?? {};
  const enabled = notify.enabled !== false;
  const remindAt = habit.remindAt ?? notify.remindAt ?? "";

  const patchNotify = (partial: Partial<HabitNotifySettings>) => {
    onChange(mergeHabitNotify(habit, partial));
  };

  return (
    <li className="coach-habit-row">
      <div className="coach-habit-row__head">
        <button type="button" className="coach-habit-row__expand" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? "▾" : "▸"}
        </button>
        <span className="coach-habit-row__name">{habit.name}</span>
        <span className="coach-habit-row__cat">{habit.category}</span>
        <input
          type="time"
          className="coach-input coach-input--time"
          value={remindAt}
          onChange={(e) => onChange(mergeHabitNotify(habit, { remindAt: e.target.value, enabled: true }))}
        />
      </div>
      {expanded && (
        <div className="coach-habit-row__body">
          <SettingsToggleRow label="Reminders on" checked={enabled} onChange={(v) => patchNotify({ enabled: v })} />
          <FieldRow label="Custom message">
            <input
              className="coach-input"
              value={notify.message ?? ""}
              placeholder="Optional title override"
              onChange={(e) => patchNotify({ message: e.target.value })}
            />
          </FieldRow>
          <SettingsToggleRow
            label="Missed alert"
            checked={notify.missedAlert !== false}
            onChange={(v) => patchNotify({ missedAlert: v })}
          />
          <FieldRow label="Active days">
            <div className="coach-days">
              {WEEKDAYS.map((name, day) => {
                const active = !notify.days?.length || notify.days.includes(day);
                return (
                  <button
                    key={name}
                    type="button"
                    className={`coach-day${active ? " coach-day--on" : ""}`}
                    onClick={() => {
                      const base = notify.days?.length ? [...notify.days] : [0, 1, 2, 3, 4, 5, 6];
                      const next = base.includes(day) ? base.filter((d) => d !== day) : [...base, day].sort();
                      patchNotify({ days: next.length === 7 ? [] : next });
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </FieldRow>
        </div>
      )}
    </li>
  );
}
