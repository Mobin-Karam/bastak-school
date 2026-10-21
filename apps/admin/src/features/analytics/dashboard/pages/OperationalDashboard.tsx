import { SchoolOccupancyBanner } from "../../school-home/components/SchoolOccupancyBanner";
import { RoleDashboard } from "../components/RoleDashboard";
import { useDashboardData } from "../hooks/useDashboardData";

export default function OperationalDashboard() {
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
