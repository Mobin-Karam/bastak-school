import { useAuth } from "../../auth";
import { GuardianPage } from "../../guardian";
import { RoleDashboard } from "../components/RoleDashboard";
import { StudentDashboard } from "../components/StudentDashboard";
import { TeacherDashboard } from "../../teacher-portal";
import { SchoolManagerDashboard } from "../../school-home";
import { useDashboardData } from "../hooks/useDashboardData";
import { SchoolOccupancyBanner } from "../../school-home/components/SchoolOccupancyBanner";
import { dashboardCompositionForRole } from "../model/role-dashboard-composition";

export function DashboardPage() {
  const auth = useAuth();

  switch (dashboardCompositionForRole(auth.activeRole)) {
    case "student":
      return <StudentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "school":
      return <SchoolManagerDashboard />;
    case "guardian":
      return <GuardianPage />;
    default:
      return <OperationalDashboard />;
  }
}

function OperationalDashboard() {
  const dashboard = useDashboardData();

  return (
    <div className="grid gap-3" dir="rtl">
      <SchoolOccupancyBanner />
      <RoleDashboard
        data={dashboard.summary.data}
        loading={dashboard.summary.isLoading}
        error={dashboard.summary.isError}
        workItems={dashboard.workItems}
        workLoading={dashboard.workQueue.isLoading}
        workError={dashboard.workQueue.isError}
        refreshing={dashboard.refreshing}
        onRefresh={() => void dashboard.refresh()}
        onRetry={() => void dashboard.summary.refetch()}
        onRetryWork={() => void dashboard.workQueue.refetch()}
      />
    </div>
  );
}
