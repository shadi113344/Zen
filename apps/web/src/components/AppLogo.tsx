import { useTheme } from "@/hooks/useTheme";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** auto = follow app theme; light/dark force a specific logo asset */
  variant?: "auto" | "light" | "dark";
}

const sizeClass = {
  sm: "app-logo--sm",
  md: "app-logo--md",
  lg: "app-logo--lg",
} as const;

export function AppLogo({ className = "", size = "md", variant = "auto" }: AppLogoProps) {
  const { resolved } = useTheme();
  const onLight = variant === "light" || (variant === "auto" && resolved === "light");

  return (
    <img
      src={onLight ? "/logo-light.png" : "/logo-dark.png"}
      alt="Zen"
      className={["app-logo", sizeClass[size], className].filter(Boolean).join(" ")}
      width={512}
      height={512}
      decoding="async"
    />
  );
}
