import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { categoryToSlug, uniqueCategories } from "@mottazen/core";
import { useAppDate } from "@/hooks/useAppDate";
import { useHabits } from "@/hooks/useData";
import { useSession } from "@/hooks/useSession";
import { userDisplayName, userInitial } from "@/lib/user-display";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";
import { useTheme } from "@/hooks/useTheme";
import { AppLogo } from "@/components/AppLogo";
import { DisplayDensityToggle } from "@/components/log/DisplayDensityToggle";
import { primaryNavTabs } from "@/lib/nav-tabs";

function formatDateBadge(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function DesktopHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { habits } = useHabits();
  const { user, profile } = useSession();
  const displayName = userDisplayName(user, "Account", profile);
  const avatarInitial = userInitial(user, "?", profile);
  const categories = uniqueCategories(habits);
  const { toggleTheme, resolved } = useTheme();
  const { selectedDate, isToday } = useAppDate();
  const [pressedTo, setPressedTo] = useState<string | null>(null);
  const indicator = useSlidingIndicator(navRef, ".desktop-nav__link--active", [location.pathname]);
  useEffect(() => {
    setPressedTo(null);
  }, [location.pathname]);

  const isLogRoute = /^\/log(\/|$)/.test(location.pathname);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const sync = () => {
      document.documentElement.style.setProperty("--desktop-header-h", `${el.offsetHeight}px`);
      if (isLogRoute) {
        document.documentElement.style.setProperty("--log-header-h", `${el.offsetHeight}px`);
        document.documentElement.style.setProperty("--log-header-gap", "0px");
      }
    };

    sync();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [location.pathname, isLogRoute, selectedDate, isToday, resolved, categories.length]);

  return (
    <header ref={headerRef} className="desktop-header">
      <div className="desktop-header__top">
        {isLogRoute ? (
          <>
            <div className="desktop-header__page">
              <h1 className="log-header__title">
                {isToday ? "Today" : formatDateBadge(selectedDate)}
              </h1>
              {isToday ? (
                <span className="log-header__date-badge">{formatDateBadge(selectedDate)}</span>
              ) : null}
            </div>
            <div className="desktop-header__actions">
              <span className="desktop-header__user">{displayName}</span>
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
          </>
        ) : (
          <Link to="/log" className="desktop-header__brand" aria-label="Zen home">
            <AppLogo size="sm" />
          </Link>
        )}
      </div>

      <div className="desktop-header__nav-row">
        <nav ref={navRef} className="desktop-nav" aria-label="Primary">
          <span
            className="desktop-nav__indicator"
            aria-hidden
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
              opacity: indicator.ready ? 1 : 0,
            }}
          />
          {primaryNavTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => {
                const active = pressedTo ? pressedTo === t.to : isActive;
                return `desktop-nav__link${active ? " desktop-nav__link--active" : ""}`;
              }}
              onPointerDown={() => setPressedTo(t.to)}
              onClick={(e) => {
                if (location.pathname === t.to) return;
                if (t.end && location.pathname.startsWith(`${t.to}/`)) {
                  e.preventDefault();
                  navigate(t.to);
                }
              }}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="desktop-header__categories">
          <div className="desktop-header__categories-scroll">
            <NavLink to="/categories" end className="desktop-header__cat-pill">
              All
            </NavLink>
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/categories/${categoryToSlug(cat)}`}
                className="desktop-header__cat-pill"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
