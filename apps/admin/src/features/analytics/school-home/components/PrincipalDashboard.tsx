import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CalendarDays, ClipboardCheck, DoorOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import { DataTable, type DataTableColumn } from "../../../../shared/ui/data-table";
import { useModal } from "../../../../shared/ui/modal";
import "./principal-dashboard-layout.css";
import {
  getPrincipalDashboard,
  getAttendanceSessionForReview,
  reviewAttendanceSession,
} from "../api/principal-dashboard.api";
import {
  PrincipalAttendanceReviewItem,
  type PrincipalAttendanceReviewSession,
} from "./PrincipalAttendanceReviewItem";
import { PrincipalOperationalLists } from "./PrincipalOperationalLists";

type SessionReview = PrincipalAttendanceReviewSession;

function formatDay(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "تاریخ نامشخص"
    : date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

export function PrincipalDashboard() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const modal = useModal();
  const range = "7d" as const;
  const classId = "";
  const dashboard = useQuery({
    queryKey: ["principal-dashboard", range, classId, auth.context?.activeOrganization?.id],
    queryFn: () => getPrincipalDashboard(range, classId || undefined),
  });
  const reviewSession = useMutation({
    mutationFn: reviewAttendanceSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["principal-dashboard"] }),
  });
  if (dashboard.isLoading) return <LoadingState label="در حال آماده‌سازی داشبورد مدیریت…" />;
  if (dashboard.isError || !dashboard.data)
    return <DashboardError onRetry={() => void dashboard.refetch()} />;
  const data = dashboard.data;
  const sessionReviewItems = data.sessionReviews?.items ?? [];
  const openAttendanceReviewDetails = (item: SessionReview) => {
    modal.open({
      title: "جزئیات غیبت‌های جلسه",
      description: item.title,
      size: "xl",
      content: <AttendanceReviewDetails item={item} onClose={modal.close} />,
    });
  };
  const sessionReviewColumns: DataTableColumn<SessionReview>[] = [
    {
      id: "title",
      label: "جلسه",
      primary: true,
      value: (item) => item.title,
      cell: (item) => (
        <PrincipalAttendanceReviewItem
          session={item}
          busy={reviewSession.isPending}
          onReview={(session) => {
            if (session.absent === 0) reviewSession.mutate(session.id);
            else openAttendanceReviewDetails(session);
          }}
        />
      ),
    },
    { id: "present", label: "حاضر", value: (item) => item.present },
    { id: "absent", label: "غایب", value: (item) => item.absent },
    { id: "late", label: "تأخیر", value: (item) => item.late },
    {
      id: "marked",
      label: "ثبت وضعیت",
      value: (item) => (item.expected == null ? item.marked : `${item.marked} از ${item.expected}`),
    },
  ];
  const queues = data.queues;
  const operations = data.operations;
  const queueItems = [
    {
      label: "مرخصی",
      value: queues?.leaveRequests ?? 0,
      to: "/admin/leave-requests",
      capability: "leave.read",
    },
    {
      label: "خروج",
      value: queues?.exitRequests ?? 0,
      to: "/admin/exit-permissions",
      capability: "exit.read",
    },
    {
      label: "درخواست مجوز",
      value: queues?.permissionRequests ?? 0,
      to: "/admin/permission-requests",
      capability: "permission_requests.read",
    },
  ].filter((item) => auth.can(item.capability));
  return (
    <main className="principal-dashboard mx-auto grid w-full max-w-7xl gap-4" dir="rtl">
      <PrincipalOperationalLists lists={data.principalLists} />
      <section className="principal-dashboard__principal-layout" aria-label="داشبورد مدیر مدرسه">
        {auth.can("attendance.review") && data.sessionReviews ? (
          <Card className="principal-dashboard__session-reviews space-y-4 p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>بازبینی روزانه</p>
                <h2>فهرست جلسه‌های حضورِ نیازمند بررسی</h2>
              </div>
              <ClipboardCheck aria-hidden="true" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {data.sessionReviews.mode === "automatic"
                ? "جلسه‌های حضور بدون بازبینی مدیر به‌صورت خودکار نهایی می‌شوند."
                : `${data.sessionReviews.pendingCount.toLocaleString("fa-IR")} جلسهٔ خوانده‌نشده در چرخهٔ ۲۴ ساعته قرار دارد؛ فقط جلسه‌های دارای غیبت برای بازبینی مدیر نمایش داده می‌شوند.`}
            </p>
            {sessionReviewItems.length ? (
              <DataTable
                data={sessionReviewItems}
                columns={sessionReviewColumns}
                getRowId={(item) => item.id}
                label="فهرست جلسه‌های حضور خوانده‌نشده"
                busy={reviewSession.isPending}
                preferenceKey={`principal-session-reviews:${auth.context?.activeOrganization?.id ?? "all"}`}
              />
            ) : (
              <Empty text="جلسهٔ خوانده‌نشده‌ای برای بازبینی در چرخهٔ ۲۴ ساعت گذشته وجود ندارد." />
            )}
            {reviewSession.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                ثبت بازبینی انجام نشد؛ دوباره تلاش کنید.
              </p>
            ) : null}
          </Card>
        ) : null}
        <div className="principal-dashboard__principal-side">
          <section className="principal-dashboard__daily-grid" aria-label="پیگیری‌های امروز">
            <Card className="principal-dashboard__daily-card p-5">
              <div className="principal-dashboard__section-heading">
                <div>
                  <p>در انتظار تصمیم</p>
                  <h2>درخواست‌های مرخصی</h2>
                </div>
                <CalendarDays aria-hidden="true" />
              </div>
              {auth.can("leave.read") && data.pendingLeaveRequests?.length ? (
                <ul className="principal-dashboard__daily-list">
                  {data.pendingLeaveRequests.map((request) => (
                    <li key={request.id}>
                      <Link
                        to={`/admin/leave-requests?requestId=${encodeURIComponent(request.id)}`}
                      >
                        <span>
                          <strong>{request.studentName}</strong>
                          <small>
                            {request.leaveType === "SCHOOL_EXIT" ? "خروج از مدرسه" : "مرخصی"}
                          </small>
                        </span>
                        <b>{formatDay(request.startDate)}</b>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="درخواست مرخصیِ منتظر تصمیمی وجود ندارد." />
              )}
              {auth.can("leave.read") && (
                <Link className="principal-dashboard__daily-action" to="/admin/leave-requests">
                  بررسی درخواست‌ها <ArrowLeft size={15} />
                </Link>
              )}
            </Card>
            <Card className="principal-dashboard__daily-card p-5">
              <div className="principal-dashboard__section-heading">
                <div>
                  <p>وضعیت مدرسه</p>
                  <h2>عملیات فعال</h2>
                </div>
                <DoorOpen aria-hidden="true" />
              </div>
              {operations ? (
                <dl className="principal-dashboard__daily-metrics">
                  <div>
                    <dt>دانش‌آموز فعال</dt>
                    <dd>{operations.activeStudents.toLocaleString("fa-IR")}</dd>
                  </div>
                  <div>
                    <dt>خارج از مدرسه</dt>
                    <dd>{operations.currentlyOut.toLocaleString("fa-IR")}</dd>
                  </div>
                  <div>
                    <dt>برنامهٔ امروز</dt>
                    <dd>{operations.scheduleEntries.toLocaleString("fa-IR")}</dd>
                  </div>
                  <div>
                    <dt>کارکنان</dt>
                    <dd>{operations.staff.toLocaleString("fa-IR")}</dd>
                  </div>
                </dl>
              ) : (
                <Empty text="وضعیت عملیات برای سطح دسترسی فعلی در دسترس نیست." />
              )}
            </Card>
          </section>
          <section
            className="principal-dashboard__status-grid grid gap-4"
            aria-label="اقدام‌های مدرسه"
          >
            <Card className="principal-dashboard__queues p-5">
              <div className="principal-dashboard__section-heading">
                <div>
                  <p>اقدام‌های فوری</p>
                  <h2>صف‌های منتظر تصمیم</h2>
                </div>
                <ClipboardCheck aria-hidden="true" />
              </div>
              {queueItems.length ? (
                <div className="grid gap-2">
                  {queueItems.map((item) => (
                    <Link key={item.label} to={item.to} className="principal-dashboard__queue">
                      <span>{item.label}</span>
                      <strong>{item.value.toLocaleString("fa-IR")}</strong>
                      <ArrowLeft size={16} />
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty text="در حال حاضر صف قابل مشاهده‌ای ندارید." />
              )}
            </Card>
          </section>
        </div>
      </section>

      {auth.can("attendance.review") && (data.sessionReviews?.pendingCount ?? 0) > 0 ? (
        <Link
          to="/admin/attendance?section=sessions"
          aria-label="بررسی جلسه‌های حضور خوانده‌نشده"
          className="fixed bottom-5 left-5 z-40 inline-flex animate-pulse items-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 motion-reduce:animate-none"
        >
          <ClipboardCheck size={18} aria-hidden="true" />
          بررسی جلسه‌های حضور
        </Link>
      ) : null}
    </main>
  );
}

function AttendanceReviewDetails({ item, onClose }: { item: SessionReview; onClose: () => void }) {
  const queryClient = useQueryClient();
  const sessionDetail = useQuery({
    queryKey: ["principal-attendance-review-detail", item.id],
    queryFn: () => getAttendanceSessionForReview(item.id),
  });
  const reviewSession = useMutation({
    mutationFn: reviewAttendanceSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["principal-dashboard"] });
      onClose();
    },
  });
  const absentRecords = sessionDetail.data?.records.filter(
    (record) => record.physicalStatus === "absent",
  );

  return (
    <div className="grid gap-4">
      {sessionDetail.isLoading ? (
        <LoadingState label="در حال دریافت فهرست دانش‌آموزان غایب…" />
      ) : sessionDetail.isError || !sessionDetail.data ? (
        <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          دریافت جزئیات جلسه ممکن نشد. دسترسی و اتصال را بررسی کنید و دوباره تلاش کنید.
          <button
            type="button"
            className="ms-3 font-bold underline"
            onClick={() => void sessionDetail.refetch()}
          >
            تلاش دوباره
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ReviewCount label="غایب" value={item.absent} />
            <ReviewCount label="حاضر" value={item.present} />
            <ReviewCount label="تأخیر" value={item.late} />
            <ReviewCount label="ثبت‌نشده" value={sessionDetail.data.unmarked ?? 0} />
          </div>
          <div className="grid gap-2">
            <h3 className="font-bold">دانش‌آموزان ثبت‌شده به‌عنوان غایب</h3>
            {absentRecords?.length ? (
              <ul className="grid max-h-[45dvh] gap-2 overflow-y-auto">
                {absentRecords.map((record) => {
                  const student = sessionDetail.data.roster.find(
                    (member) => member.id === record.studentId,
                  );
                  return (
                    <li
                      key={record.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
                    >
                      <span className="font-semibold">{student?.name ?? "دانش‌آموز"}</span>
                      {record.note ? (
                        <span className="text-sm text-slate-600">{record.note}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                در خلاصهٔ جلسه غیبت ثبت شده، اما جزئیات فعلی غایبی نشان نمی‌دهد. لطفاً صفحه را
                تازه‌سازی کنید؛ بازبینی تا تطبیق اطلاعات ثبت نمی‌شود.
              </p>
            )}
          </div>
          {absentRecords?.length ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="min-h-11 rounded-xl border border-[rgb(var(--border-subtle))] px-4 font-semibold"
                disabled={reviewSession.isPending}
                onClick={onClose}
              >
                بازگشت
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl bg-brand px-4 font-bold text-white disabled:opacity-50"
                disabled={reviewSession.isPending}
                onClick={() => reviewSession.mutate(item.id)}
              >
                {reviewSession.isPending ? "در حال ثبت بازبینی…" : "جزئیات را بررسی و تأیید می‌کنم"}
              </button>
            </div>
          ) : null}
        </>
      )}
      {reviewSession.isError ? (
        <p role="alert" className="text-sm text-rose-700">
          ثبت بازبینی انجام نشد؛ دوباره تلاش کنید.
        </p>
      ) : null}
    </div>
  );
}

function ReviewCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black">{value.toLocaleString("fa-IR")}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="principal-dashboard__empty">{text}</p>;
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
