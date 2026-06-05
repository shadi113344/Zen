import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";
import { DataProvider } from "@/hooks/useData";
import { DisplayProvider } from "@/hooks/useDisplayPrefs";
import { HapticSettingsProvider } from "@/hooks/useHapticSettings";
import { SessionProvider } from "@/hooks/useSession";
import { ThemeProvider } from "@/hooks/useTheme";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
