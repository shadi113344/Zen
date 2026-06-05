import { Link } from "react-router-dom";
import { DisplayDensityToggle } from "@/components/log/DisplayDensityToggle";
import { useAppDate } from "@/hooks/useAppDate";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import { userInitial } from "@/lib/user-display";

interface LogHeaderProps {
  isToday: boolean;
}

function formatLogDate(dateKey: string): string {
  return new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function LogHeader({ isToday }: LogHeaderProps) {
  const { selectedDate } = useAppDate();
  const { user, profile } = useSession();
  const { toggleTheme, resolved } = useTheme();
  const avatarInitial = userInitial(user, "?", profile);

  return (
    <header className="log-header tab-screen-header">
      <div className="log-header__title-row">
        <div className="log-header__title-block">
          <h1 className="log-header__title">
            {isToday ? "Today" : formatLogDate(selectedDate)}
          </h1>
        </div>
        <div className="log-header__actions">
          <DisplayDensityToggle />
          <button
            type="button"
            className="log-header__icon-btn log-header__icon-btn--theme"
            onClick={toggleTheme}
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="log-header__theme-icon" aria-hidden>
              {resolved === "dark" ? "☀" : "☾"}
            </span>
          </button>
          <Link to="/profile" className="log-header__avatar" aria-label="Profile">
            {avatarInitial}
          </Link>
        </div>
      </div>
    </header>
  );
}

export { shiftDate } from "@/hooks/useAppDate";
