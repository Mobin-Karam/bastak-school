import { lazy, Suspense } from "react";
import { useAuth } from "../../../identity/auth";
import { dashboardCompositionForRole } from "../model/role-dashboard-composition";

const StudentDashboard = lazy(() =>
  import("../components/StudentDashboard").then((module) => ({
    default: module.StudentDashboard,
  })),
);
const TeacherDashboard = lazy(() =>
  import("../../../people/teacher-portal/pages/TeacherDashboard").then((module) => ({
    default: module.TeacherDashboard,
  })),
);
const SchoolManagerDashboard = lazy(() =>
  import("../../school-home/components/SchoolManagerDashboard").then((module) => ({
    default: module.SchoolManagerDashboard,
  })),
);
const GuardianPage = lazy(() =>
  import("../../../people/guardian/pages/GuardianPage").then((module) => ({
    default: module.GuardianPage,
  })),
);
const OperationalDashboard = lazy(() => import("./OperationalDashboard"));

export function DashboardPage() {
  const auth = useAuth();

  const Dashboard =
    dashboardCompositionForRole(auth.activeRole) === "student"
      ? StudentDashboard
      : dashboardCompositionForRole(auth.activeRole) === "teacher"
        ? TeacherDashboard
        : dashboardCompositionForRole(auth.activeRole) === "school"
          ? SchoolManagerDashboard
          : dashboardCompositionForRole(auth.activeRole) === "guardian"
            ? GuardianPage
            : OperationalDashboard;

  return (
    <Suspense fallback={<DashboardLoading />}>
      <Dashboard />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-3" role="status" aria-label="در حال آماده‌سازی داشبورد">
      <div className="h-24 animate-pulse rounded-lg bg-[rgb(var(--surface-card))]" />
      <div className="h-48 animate-pulse rounded-lg bg-[rgb(var(--surface-card))]" />
    </div>
  );
}
