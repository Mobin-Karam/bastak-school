import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth";
import { getAdminDashboard, getDashboardWorkQueue } from "../api/dashboard.api";

export function useDashboardData() {
  const auth = useAuth();
  const context = auth.activeRole || "default";
  const organization = auth.context?.activeOrganization?.id || "platform";
  const summary = useQuery({
    queryKey: ["role-dashboard", context, organization],
    queryFn: getAdminDashboard,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const workQueue = useQuery({
    queryKey: ["dashboard-work-queue", context, organization],
    queryFn: () => getDashboardWorkQueue(20),
    refetchInterval: 45_000,
    staleTime: 15_000,
  });
  const refresh = async () => {
    await Promise.all([summary.refetch(), workQueue.refetch()]);
  };
  return {
    summary,
    workQueue,
    workItems: workQueue.data?.items ?? [],
    refresh,
    refreshing: summary.isFetching || workQueue.isFetching,
  };
}
