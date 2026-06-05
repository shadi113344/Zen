import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";
import { primaryNavTabs } from "@/lib/nav-tabs";

export function TabBar() {
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [pressedTo, setPressedTo] = useState<string | null>(null);
  const indicator = useSlidingIndicator(navRef, ".tab-bar__link--active", [location.pathname]);
  useEffect(() => {
    setPressedTo(null);
  }, [location.pathname]);

  return (
    <nav ref={navRef} className="tab-bar" aria-label="Primary">
      <span
        className="tab-bar__indicator"
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
            return `tab-bar__link${active ? " tab-bar__link--active" : ""}`;
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
  );
}
