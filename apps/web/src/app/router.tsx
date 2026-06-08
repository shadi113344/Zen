import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AuthPage } from "@/routes/AuthPage";
import { LogPage } from "@/routes/LogPage";
import { ResetPasswordPage } from "@/routes/ResetPasswordPage";
import { isDemoMode } from "@/lib/demo-data";
import { supabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

// Heavy routes — loaded lazily so framer-motion, dnd-kit, lottie, html-to-image
// stay out of the initial bundle.
const DashboardPage = lazy(() =>
  import("@/routes/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const RecapPage = lazy(() =>
  import("@/routes/RecapPage").then((m) => ({ default: m.RecapPage })),
);
const HabitDetailPage = lazy(() =>
  import("@/routes/HabitDetailPage").then((m) => ({ default: m.HabitDetailPage })),
);
const CategoriesLayout = lazy(() =>
  import("@/routes/CategoriesLayout").then((m) => ({ default: m.CategoriesLayout })),
);
const CategoriesIndexPage = lazy(() =>
  import("@/routes/CategoriesIndexPage").then((m) => ({ default: m.CategoriesIndexPage })),
);
const CategoryDetailPage = lazy(() =>
  import("@/routes/CategoryDetailPage").then((m) => ({ default: m.CategoryDetailPage })),
);
const GoalsPage = lazy(() =>
  import("@/routes/GoalsPage").then((m) => ({ default: m.GoalsPage })),
);
const GoalDetailPage = lazy(() =>
  import("@/routes/GoalDetailPage").then((m) => ({ default: m.GoalDetailPage })),
);
const ProfilePage = lazy(() =>
  import("@/routes/ProfilePages").then((m) => ({ default: m.ProfilePage })),
);
const NotificationsPage = lazy(() =>
  import("@/routes/ProfilePages").then((m) => ({ default: m.NotificationsPage })),
);
const ProfileDataPage = lazy(() =>
  import("@/routes/ProfilePages").then((m) => ({ default: m.ProfileDataPage })),
);
const ProfileDisplayPage = lazy(() =>
  import("@/routes/ProfilePages").then((m) => ({ default: m.ProfileDisplayPage })),
);
const ProfileAccountPage = lazy(() =>
  import("@/routes/ProfileAccountPage").then((m) => ({ default: m.ProfileAccountPage })),
);
const ProfileHapticsPage = lazy(() =>
  import("@/routes/ProfileHapticsPage").then((m) => ({ default: m.ProfileHapticsPage })),
);
const ProfileThemePage = lazy(() =>
  import("@/routes/ProfileThemePage").then((m) => ({ default: m.ProfileThemePage })),
);

function PageFallback() {
  return <div className="stub-page"><p>Loading…</p></div>;
}

function ProtectedLayout() {
  const { session, loading } = useSession();

  if (supabaseConfigured && !isDemoMode) {
    if (loading) {
      return <PageFallback />;
    }
    if (!session) {
      return <Navigate to="/auth" replace />;
    }
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <AppShell />
    </Suspense>
  );
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
