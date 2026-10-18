import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2 } from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { Card, ErrorState, LoadingState } from "../../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { getAttendanceEncouragement } from "../api/attendance-operations.api.ts";
import { StudentAttendanceWorkspace } from "../components/StudentAttendanceWorkspace";

/** Student accounts see encouragement and scoped tasks; detailed profiles belong to staff. */
export function MyAttendancePage() {
  const auth = useAuth();
  const scope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const query = useQuery({
    queryKey: ["attendance-encouragement", scope],
    queryFn: getAttendanceEncouragement,
    refetchInterval: 60000,
  });
  return (
    <section className="grid gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="خلاصه حضور من"
        description="حضور منظم و به‌موقع، قدمی برای پیشرفت شماست."
      />
      {query.isLoading ? (
        <LoadingState label="در حال دریافت خلاصه حضور…" />
      ) : query.isError ? (
        <ErrorState
          title="خلاصه حضور دریافت نشد."
          action={
            <button type="button" onClick={() => void query.refetch()}>
              تلاش دوباره
            </button>
          }
        />
      ) : query.data ? (
        <Card className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900 dark:bg-blue-950/20">
          <CalendarCheck2 size={30} className="mb-3 text-blue-600" />
          <p className="text-base font-bold leading-8">{query.data.message}</p>
          <p className="mt-3 text-sm text-slate-500">
            {query.data.totalSessions.toLocaleString("fa-IR")} حضور ثبت‌شده
            {query.data.attendanceRate !== null
              ? ` · ${query.data.attendanceRate.toLocaleString("fa-IR")}٪ حضور`
              : ""}
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["حاضر", query.data.present],
              ["غایب", query.data.absent],
              ["تأخیر", query.data.late],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl bg-card p-3 text-center">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-xl font-black">{Number(count).toLocaleString("fa-IR")}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}
      <StudentAttendanceWorkspace key={scope} scope={scope} />
    </section>
  );
}
