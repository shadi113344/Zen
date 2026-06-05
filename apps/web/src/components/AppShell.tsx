import { Outlet } from "react-router-dom";
import { DesktopHeader } from "@/components/DesktopHeader";
import { TabBar } from "@/components/TabBar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";
import { AppDateProvider } from "@/hooks/useAppDate";
function ShellContent() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  useNotificationScheduler();

  if (desktop) {
    return (
      <div className="app-shell app-shell--desktop">
        <DesktopHeader />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

export function AppShell() {
  return (
    <AppDateProvider>
      <ShellContent />
    </AppDateProvider>
  );
}
