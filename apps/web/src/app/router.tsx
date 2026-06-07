import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AuthPage } from "@/routes/AuthPage";
import { CategoriesIndexPage } from "@/routes/CategoriesIndexPage";
import { CategoriesLayout } from "@/routes/CategoriesLayout";
import { CategoryDetailPage } from "@/routes/CategoryDetailPage";
import { HabitDetailPage } from "@/routes/HabitDetailPage";
import { DashboardPage } from "@/routes/DashboardPage";
import { LogPage } from "@/routes/LogPage";
import { RecapPage } from "@/routes/RecapPage";
import {
  NotificationsPage,
  ProfileDataPage,
  ProfileDisplayPage,
  ProfilePage,
} from "@/routes/ProfilePages";
import { GoalDetailPage } from "@/routes/GoalDetailPage";
import { GoalsPage } from "@/routes/GoalsPage";
import { ProfileAccountPage } from "@/routes/ProfileAccountPage";
import { ResetPasswordPage } from "@/routes/ResetPasswordPage";
import { ProfileHapticsPage } from "@/routes/ProfileHapticsPage";
import { ProfileThemePage } from "@/routes/ProfileThemePage";
import { isDemoMode } from "@/lib/demo-data";
import { supabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

function ProtectedLayout() {
  const { session, loading } = useSession();

  if (supabaseConfigured && !isDemoMode) {
    if (loading) {
      return (
        <div className="stub-page">
          <p>Loading…</p>
        </div>
      );
    }
    if (!session) {
      return <Navigate to="/auth" replace />;
    }
  }

  return <AppShell />;
}

export const router = createBrowserRouter([
  { path: "/auth", element: <AuthPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/log" replace /> },
      { path: "log", element: <LogPage /> },
      { path: "log/:date", element: <LogPage /> },
      { path: "habit/:id", element: <HabitDetailPage /> },
      {
        path: "categories",
        element: <CategoriesLayout />,
        children: [
          { index: true, element: <CategoriesIndexPage /> },
          { path: ":slug", element: <CategoryDetailPage /> },
        ],
      },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "recap", element: <RecapPage /> },
      { path: "recap/:period", element: <RecapPage /> },
      { path: "insights", element: <Navigate to="/dashboard" replace /> },
      { path: "insights/heatmap", element: <Navigate to="/dashboard" replace /> },
      { path: "goals/new", element: <GoalsPage openAdd /> },
      { path: "goals/:id", element: <GoalDetailPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "profile/goals", element: <Navigate to="/goals" replace /> },
      { path: "profile/notifications", element: <NotificationsPage /> },
      { path: "profile/data", element: <ProfileDataPage /> },
      { path: "profile/account", element: <ProfileAccountPage /> },
      { path: "profile/haptics", element: <ProfileHapticsPage /> },
      { path: "profile/display", element: <ProfileDisplayPage /> },
      { path: "profile/theme", element: <ProfileThemePage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
