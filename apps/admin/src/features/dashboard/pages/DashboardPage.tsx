import { useAuth } from "../../auth";
import { GuardianPage } from "../../guardian";
import { RoleDashboard } from "../components/RoleDashboard";
import { StudentDashboard } from "../components/StudentDashboard";
import { useDashboardData } from "../hooks/useDashboardData";

export function DashboardPage() {
  const auth = useAuth();

  if (auth.activeRole === "STUDENT") return <StudentDashboard />;
  if (auth.activeRole === "GUARDIAN") return <GuardianPage />;

  return <OperationalDashboard />;
}

function OperationalDashboard() {
  const dashboard = useDashboardData();

  return (
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
  );
}
