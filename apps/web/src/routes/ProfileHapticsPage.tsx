import {
  SettingsPageHeader,
  SettingsSection,
  SettingsSliderRow,
  SettingsToggleRow,
} from "@/components/settings/SettingsParts";
import { useHapticSettings } from "@/hooks/useHapticSettings";
import { hapticGoalComplete, hapticProgressBump, isAppleTouchDevice } from "@/lib/haptic";

export function ProfileHapticsPage() {
  const apple = isAppleTouchDevice();
  const {
    enabled: hapticEnabled,
    progressSteps: hapticProgressSteps,
    completion: hapticCompletion,
    progressStrength,
    completionStrength,
    setEnabled: setHapticEnabled,
    setProgressSteps: setHapticProgressSteps,
    setCompletion: setHapticCompletion,
    setProgressStrength,
    setCompletionStrength,
  } = useHapticSettings();

  const slidersDisabled = apple || !hapticEnabled;

  return (
    <div className="profile-page settings-page">
      <SettingsPageHeader title="Haptics" backTo="/profile" backLabel="Settings" />

      <div className="settings-page__groups">
        <SettingsSection>
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
          <SettingsSliderRow
            label="Progress strength"
            hint="How strong the step buzz feels"
            value={progressStrength}
            disabled={slidersDisabled || !hapticProgressSteps}
            onChange={setProgressStrength}
            onRelease={() => hapticProgressBump({ force: true })}
          />
          <SettingsToggleRow
            label="Milestones"
            hint="Longer pattern when an activity, goal, or your day hits 100%"
            checked={hapticCompletion}
            disabled={!hapticEnabled}
            onChange={setHapticCompletion}
          />
          <SettingsSliderRow
            label="Milestone strength"
            hint="How strong the completion pattern feels"
            value={completionStrength}
            disabled={slidersDisabled || !hapticCompletion}
            onChange={setCompletionStrength}
            onRelease={() => hapticGoalComplete({ force: true })}
          />
          {apple ? (
            <p className="settings-field__hint settings-field__hint--block">
              On iPhone and iPad, only direct taps on checkboxes and +/− controls use the system Taptic
              Engine. Strength sliders apply on Android and desktop browsers with vibration support.
            </p>
          ) : null}
        </SettingsSection>
      </div>
    </div>
  );
}
