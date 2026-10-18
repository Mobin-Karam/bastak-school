import { AlertCircle } from "lucide-react";
import { Button, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import type {
  AdminDashboardSummary,
  AttentionStudent,
  FollowUpMetric,
} from "../model/dashboard.types.ts";
import { AttentionInbox } from "./work/AttentionInbox";
import { DashboardFollowUpCard } from "./work/DashboardFollowUpCard";
import { DashboardMetricCards } from "./metrics/DashboardMetricCards";
import { RecentReportsCard } from "./reports/RecentReportsCard";
import { useLocale } from "../../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";

export function DashboardContent({
  summary,
  summaryLoading,
  summaryError,
  attention,
  attentionLoading,
  attentionError,
  followUp,
  refreshing,
  onRefresh,
  onRetrySummary,
  onRetryAttention,
}: {
  summary?: AdminDashboardSummary;
  summaryLoading: boolean;
  summaryError: boolean;
  attention: AttentionStudent[];
  attentionLoading: boolean;
  attentionError: boolean;
  followUp: FollowUpMetric[];
  refreshing: boolean;
  onRefresh: () => void;
  onRetrySummary: () => void;
  onRetryAttention: () => void;
}) {
  const { language } = useLocale();
  const copy = dashboardCopy[language];
  return (
    <div className="grid gap-4">
      {summaryLoading ? (
        <LoadingState label={copy.dashboardLoading} />
      ) : summaryError || !summary ? (
        <EmptyState
          title={copy.dashboardFailed}
          action={
            <Button variant="soft" onClick={onRetrySummary}>
              <AlertCircle size={15} /> {copy.retry}
            </Button>
          }
        />
      ) : (
        <DashboardMetricCards refreshing={refreshing} onRefresh={onRefresh} summary={summary} />
      )}

      <section className="grid gap-4 min-[1200px]:grid-cols-[minmax(0,1fr)_340px]">
        <AttentionInbox
          students={attention}
          loading={attentionLoading}
          error={attentionError}
          onRetry={onRetryAttention}
        />
        <DashboardFollowUpCard items={followUp} />
      </section>

      {summary ? <RecentReportsCard reports={summary.recentReports ?? []} /> : null}
    </div>
  );
}
