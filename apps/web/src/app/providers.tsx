import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { DataProvider } from "@/hooks/useData";
import { DisplayProvider } from "@/hooks/useDisplayPrefs";
import { HapticSettingsProvider } from "@/hooks/useHapticSettings";
import { SessionProvider } from "@/hooks/useSession";
import { ThemeProvider } from "@/hooks/useTheme";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider>
          <DisplayProvider>
            <HapticSettingsProvider>
              <ToastProvider>
                <DataProvider>{children}</DataProvider>
              </ToastProvider>
            </HapticSettingsProvider>
          </DisplayProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
