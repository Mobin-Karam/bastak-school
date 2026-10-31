import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import "./principal-dashboard-layout.css";
import { getPrincipalDashboard } from "../api/principal-dashboard.api";
import { PrincipalOperationalLists } from "./PrincipalOperationalLists";

export function PrincipalDashboard() {
  const auth = useAuth();
  const dashboard = useQuery({
    queryKey: ["principal-dashboard", "7d", "", auth.context?.activeOrganization?.id],
    queryFn: () => getPrincipalDashboard("7d"),
    refetchInterval: 30_000,
  });
  if (dashboard.isLoading) return <LoadingState label="در حال آماده‌سازی داشبورد مدیریت…" />;
  if (dashboard.isError || !dashboard.data)
    return <DashboardError onRetry={() => void dashboard.refetch()} />;
  return (
    <main className="principal-dashboard mx-auto grid w-full max-w-7xl gap-4" dir="rtl">
      <header className="principal-dashboard__home-heading">
        <p>میز کار مدیر</p>
        <h1>بازبینی و پیگیری مدرسه</h1>
        <span>
          هر فهرست را باز کنید تا موارد همان بخش را بررسی کنید. نتیجهٔ بررسی در سابقهٔ همان بخش
          ذخیره می‌شود.
        </span>
      </header>
      <PrincipalOperationalLists
        lists={dashboard.data.principalLists}
        sessionReviews={dashboard.data.sessionReviews}
        canReviewAttendance={auth.can("attendance.review")}
      />
    </main>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="principal-dashboard__error p-6" role="alert">
      <AlertTriangle aria-hidden="true" />
      <h1>داشبورد مدیریت دریافت نشد</h1>
      <p>اتصال یا سطح دسترسی مدرسه را بررسی کنید.</p>
      <button type="button" onClick={onRetry}>
        تلاش مجدد
      </button>
    </Card>
  );
}
