import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  UsersRound,
  Coins,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Pie as RechartsPie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  RadarChart,
  Tooltip,
} from "recharts";
import { useAuth } from "../../../identity/auth";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import { DataTable, type DataTableColumn } from "../../../../shared/ui/data-table";
import { useModal } from "../../../../shared/ui/modal";
import { ChartContainer, ChartTooltipContent } from "../../../../shared/ui/chart-container";
import "./principal-dashboard-layout.css";
import {
  getPrincipalDashboard,
  getAttendanceSessionForReview,
  reviewAttendanceSession,
  type PrincipalDashboardContract,
} from "../api/principal-dashboard.api";
import { getRecentRewardTransactions, type RewardTransaction } from "../../../rewards/api/rewards.api";

type Point = { label: string; value: number; color: string };
type AttendanceData = NonNullable<PrincipalDashboardContract["attendance"]>;
type SessionReview = NonNullable<PrincipalDashboardContract["sessionReviews"]>["items"][number];

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
  const recentRewards = useQuery({
    queryKey: ["rewards", "recent", auth.context?.activeOrganization?.id],
    queryFn: getRecentRewardTransactions,
    enabled: auth.can("rewards.read"),
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
  const openRewardDetails = (item: RewardTransaction) => {
    modal.open({
      title: "جزئیات تراکنش سکه",
      description: item.studentName,
      size: "md",
      content: <div className="space-y-3" dir="rtl">
        <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm">{item.reason}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">مبلغ</dt><dd className="font-black">{item.points > 0 ? "+" : ""}{item.points.toLocaleString("fa-IR")}</dd></div>
          <div><dt className="text-slate-500">ثبت‌کننده</dt><dd>{item.awardedBy?.name ?? "سامانه"}</dd></div>
          <div><dt className="text-slate-500">کلاس/محل</dt><dd>{item.contextName ?? "نامشخص"}</dd></div>
          <div><dt className="text-slate-500">زمان</dt><dd>{new Date(item.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</dd></div>
        </dl>
      </div>,
    });
  };
  const sessionReviewColumns: DataTableColumn<SessionReview>[] = [
    {
      id: "title",
      label: "جلسه",
      primary: true,
      value: (item) => item.title,
      cell: (item) => (
        <div className="grid gap-1">
          <strong>{item.title}</strong>
          <span className="text-xs text-slate-500">
            {new Date(item.sessionDate).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}
            {item.lastReviewedAt
              ? ` · آخرین بازبینی ${new Date(item.lastReviewedAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}`
              : " · هنوز بازبینی نشده"}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      label: "وضعیت",
      value: (item) => item.status,
      cell: (item) => (
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {item.status === "submitted" ? "ثبت‌شده" : "نهایی‌شده"}
        </span>
      ),
      filter: {
        type: "select",
        options: [
          { value: "submitted", label: "ثبت‌شده" },
          { value: "finalized", label: "نهایی‌شده" },
        ],
      },
    },
    { id: "present", label: "حاضر", value: (item) => item.present },
    { id: "absent", label: "غایب", value: (item) => item.absent },
    { id: "late", label: "تأخیر", value: (item) => item.late },
    {
      id: "marked",
      label: "ثبت وضعیت",
      value: (item) => (item.expected == null ? item.marked : `${item.marked} از ${item.expected}`),
    },
    {
      id: "review",
      label: "بازبینی",
      sortable: false,
      hideable: false,
      value: () => "",
      cell: (item) => (
        <button
          type="button"
          className="min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50"
          disabled={reviewSession.isPending}
          onClick={(event) => {
            event.stopPropagation();
            if (item.absent === 0) reviewSession.mutate(item.id);
            else openAttendanceReviewDetails(item);
          }}
        >
          {reviewSession.isPending && reviewSession.variables === item.id
            ? "در حال ثبت بازبینی…"
            : item.absent === 0
              ? "تأیید بازبینی و ثبت"
              : `مشاهدهٔ جزئیات ${item.absent.toLocaleString("fa-IR")} غایب`}
        </button>
      ),
    },
  ];
  const attendance = data.attendance;
  const queues = data.queues;
  const operations = data.operations;
  const todayAttendance = attendance?.today;
  const totalAttendance = todayAttendance
    ? todayAttendance.present +
      todayAttendance.absent +
      todayAttendance.late +
      todayAttendance.excused
    : 0;
  const queueItems = [
    {
      label: "بررسی غیبت",
      value: queues?.attendanceReviews ?? 0,
      to: "/admin/attendance?section=sessions",
      capability: "attendance.review",
    },
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
      <section className="principal-dashboard__daily-grid" aria-label="پیگیری‌های امروز">
        <Card className="principal-dashboard__daily-card p-5">
          <div className="principal-dashboard__section-heading">
            <div>
              <p>حضور امروز</p>
              <h2>دانش‌آموزان غایب</h2>
            </div>
            <UsersRound aria-hidden="true" />
          </div>
          {auth.can("students.read") && data.todayAbsences?.length ? (
            <ul className="principal-dashboard__daily-list">
              {data.todayAbsences.map((student) => (
                <li key={student.id}>
                  <Link to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}>
                    <span>
                      <strong>{student.name}</strong>
                      <small>{student.context}</small>
                    </span>
                    <b>{student.sessions.toLocaleString("fa-IR")} جلسه</b>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="برای امروز غیبت ثبت‌شده‌ای وجود ندارد." />
          )}
          {(auth.can("attendance.read") || auth.can("attendance.review")) && (
            <Link className="principal-dashboard__daily-action" to="/admin/attendance">
              مشاهده و مدیریت حضور <ArrowLeft size={15} />
            </Link>
          )}
        </Card>
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
                  <Link to={`/admin/leave-requests?requestId=${encodeURIComponent(request.id)}`}>
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
              <p>وضعیت امروز</p>
              <h2>خلاصهٔ حضور مدرسه</h2>
            </div>
            <CheckCircle2 aria-hidden="true" />
          </div>
          {attendance ? (
            <dl className="principal-dashboard__daily-metrics">
              <div>
                <dt>حاضر</dt>
                <dd>{(todayAttendance?.present ?? 0).toLocaleString("fa-IR")}</dd>
              </div>
              <div>
                <dt>غایب</dt>
                <dd>{(todayAttendance?.absent ?? 0).toLocaleString("fa-IR")}</dd>
              </div>
              <div>
                <dt>تأخیر</dt>
                <dd>{(todayAttendance?.late ?? 0).toLocaleString("fa-IR")}</dd>
              </div>
              <div>
                <dt>نرخ حضور</dt>
                <dd>
                  {todayAttendance?.rate == null
                    ? "—"
                    : `${todayAttendance.rate.toLocaleString("fa-IR")}٪`}
                </dd>
              </div>
            </dl>
          ) : (
            <Empty text="دادهٔ حضور برای سطح دسترسی فعلی در دسترس نیست." />
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
      {auth.can("rewards.read") ? (
        <Card className="principal-dashboard__daily-card p-5">
          <div className="principal-dashboard__section-heading">
            <div><p>۲۴ ساعت گذشته</p><h2>تراکنش‌های سکه</h2></div>
            <Coins aria-hidden="true" />
          </div>
          {recentRewards.isLoading ? <p className="text-sm text-slate-500">در حال دریافت تراکنش‌ها…</p> : recentRewards.data?.length ? (
            <ul className="principal-dashboard__daily-list">
              {recentRewards.data.map((item) => <li key={item.id}><button type="button" className="w-full text-start" onClick={() => openRewardDetails(item)}><span><strong>{item.studentName}</strong><small>{item.reason} · {item.contextName ?? "محل نامشخص"}</small></span><b className={item.points >= 0 ? "text-emerald-600" : "text-rose-600"}>{item.points > 0 ? "+" : ""}{item.points.toLocaleString("fa-IR")}</b></button></li>)}
            </ul>
          ) : <Empty text="در ۲۴ ساعت گذشته تراکنش سکه‌ای ثبت نشده است." />}
          <Link className="principal-dashboard__daily-action" to="/admin/rewards">مشاهدهٔ همهٔ تراکنش‌ها <ArrowLeft size={15} /></Link>
        </Card>
      ) : null}

      <section className="principal-dashboard__status-grid grid gap-4" aria-label="وضعیت حضور">
        {attendance ? (
          <Card className="principal-dashboard__attendance p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>وضعیت حضور</p>
                <h2>نبض مدرسه</h2>
              </div>
              <Link to="/admin/attendance">
                مدیریت حضور <ArrowLeft size={15} />
              </Link>
            </div>
            <div className="principal-dashboard__attendance-grid">
              <Gauge value={todayAttendance?.rate ?? null} label="نرخ حضور امروز" />
              <Pie
                points={[
                  { label: "حاضر", value: todayAttendance?.present ?? 0, color: "#22c55e" },
                  { label: "غایب", value: todayAttendance?.absent ?? 0, color: "#f43f5e" },
                  { label: "تأخیر", value: todayAttendance?.late ?? 0, color: "#f59e0b" },
                  { label: "موجه", value: todayAttendance?.excused ?? 0, color: "#38bdf8" },
                ]}
                total={totalAttendance}
              />
            </div>
            <AttendanceLegend attendance={todayAttendance} />
          </Card>
        ) : null}
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

      <section
        className="principal-dashboard__behaviour-layout grid gap-4"
        aria-label="رفتار و پیشرفت"
      >
        {data.behaviour ? (
          <Card className="principal-dashboard__behaviour-card p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>رفتار و پیشرفت</p>
                <h2>نمایهٔ یادگیری دانش‌آموزان</h2>
              </div>
              <GraduationCap aria-hidden="true" />
            </div>
            <div className="principal-dashboard__behaviour-grid">
              <Radar dimensions={data.behaviour.dimensions} />
              <table className="principal-dashboard__radar-table">
                <caption>مقادیر نمایه بر پایهٔ نسبت حضور و مشارکت</caption>
                <tbody>
                  {data.behaviour.dimensions.map((item) => (
                    <tr key={item.key}>
                      <th scope="row">{item.label}</th>
                      <td>
                        {item.value == null
                          ? "دادهٔ کافی نیست"
                          : `${item.value.toLocaleString("fa-IR")}٪`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="principal-dashboard__chart-note">
              این نما یک شاخص تجمیعی است، نه ارزیابی فردی. برای اقدام، فهرست نیازمند توجه را باز
              کنید.
            </p>
          </Card>
        ) : null}
        {data.behaviour ? (
          <Card className="principal-dashboard__risk-card p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>نیازمند توجه</p>
                <h2>پیگیری زودهنگام</h2>
              </div>
              <AlertTriangle aria-hidden="true" />
            </div>
            {data.behaviour.risks.length ? (
              <div className="grid gap-2">
                {data.behaviour.risks.map((student) => (
                  <Link
                    className="principal-dashboard__risk"
                    key={student.id}
                    to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}
                  >
                    <span
                      className={student.attention === "high" ? "is-high" : "is-medium"}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{student.name}</strong>
                      <small>
                        {student.absent.toLocaleString("fa-IR")} غیبت ·{" "}
                        {student.late.toLocaleString("fa-IR")} تأخیر
                      </small>
                    </span>
                    <ArrowLeft size={15} />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty text="در این بازه مورد نیازمند پیگیری ثبت نشده است." />
            )}
          </Card>
        ) : null}
      </section>

      {auth.can("attendance.review") && data.sessionReviews ? (
        <Card className="principal-dashboard__session-reviews space-y-4 p-5">
          <div className="principal-dashboard__section-heading">
            <div>
              <p>بازبینی روزانه</p>
              <h2>جلسه‌های حضورِ نیازمند بررسی</h2>
            </div>
            <ClipboardCheck aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.sessionReviews.pendingCount.toLocaleString("fa-IR")} جلسه در چرخهٔ بازبینی هر ۲۴
            ساعت قرار دارد. خلاصه را بررسی و بازبینی را ثبت کنید.
          </p>
          {sessionReviewItems.length ? (
            <DataTable
              data={sessionReviewItems}
              columns={sessionReviewColumns}
              getRowId={(item) => item.id}
              label="جلسه‌های حضور نیازمند بررسی"
              busy={reviewSession.isPending}
              preferenceKey={`principal-session-reviews:${auth.context?.activeOrganization?.id ?? "all"}`}
            />
          ) : (
            <Empty text="همهٔ جلسه‌های ثبت‌شده در ۲۴ ساعت گذشته بازبینی شده‌اند." />
          )}
          {reviewSession.isError ? (
            <p role="alert" className="text-sm text-rose-700">
              ثبت بازبینی انجام نشد؛ دوباره تلاش کنید.
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* {attendance ? (
        <section
          className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]"
          aria-label="پوشش کلاس و روند حضور"
        >
          <Card className="principal-dashboard__coverage p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>پوشش کلاس‌ها</p>
                <h2>تکمیل ثبت حضور</h2>
              </div>
              <CheckCircle2 aria-hidden="true" />
            </div>
            <RadialBars classes={attendance.classes} />
          </Card>
          <Card className="principal-dashboard__trend-card p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>روند حضور</p>
                <h2>تغییرات روزانه</h2>
              </div>
              <CalendarDays aria-hidden="true" />
            </div>
            <Trend rows={attendance.trend} />
          </Card>
        </section>
      ) : null} */}

      {/* <section className="principal-dashboard__metrics grid gap-3" aria-label="عملیات مدرسه">
        <Metric
          icon={UsersRound}
          label="دانش‌آموز فعال"
          value={operations?.activeStudents}
          visible={auth.can("students.read")}
        />
        <Metric
          icon={DoorOpen}
          label="خارج از مدرسه"
          value={operations?.currentlyOut}
          visible={auth.can("exit.read")}
        />
        <Metric
          icon={CalendarDays}
          label="برنامهٔ فعال"
          value={operations?.scheduleEntries}
          visible={auth.can("schedule.read.all")}
        />
        <Metric
          icon={UsersRound}
          label="همکاران"
          value={operations?.staff}
          visible={auth.can("students.read")}
        />
      </section> */}
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

function Gauge({ value, label }: { value: number | null; label: string }) {
  const safe = value ?? 0;
  return (
    <div className="principal-gauge">
      <ChartContainer
        config={{
          attendance: { label, color: "#0f766e" },
          remainder: { label: "باقی‌مانده", color: "#dbe8e6" },
        }}
        className="principal-gauge__chart"
        style={{ height: 152 }}
        role="img"
        aria-label={`${label}: ${value == null ? "نامشخص" : `${value} درصد`}`}
      >
        <PieChart accessibilityLayer>
          <RechartsPie
            data={[
              { name: label, value: safe, fill: "var(--color-attendance)" },
              { name: "باقی‌مانده", value: 100 - safe, fill: "var(--color-remainder)" },
            ]}
            dataKey="value"
            startAngle={180}
            endAngle={0}
            innerRadius={48}
            outerRadius={65}
            paddingAngle={1}
            stroke="none"
            isAnimationActive={false}
          />
          <text
            x="50%"
            y="77%"
            textAnchor="middle"
            className="fill-[rgb(var(--color-ink))] text-base font-black"
          >
            {value == null ? "—" : `${value.toLocaleString("fa-IR")}٪`}
          </text>
        </PieChart>
      </ChartContainer>
      <span>{label}</span>
    </div>
  );
}
function Pie({ points, total }: { points: Point[]; total: number }) {
  const chartData = points.map((point) => ({ ...point, name: point.label, fill: point.color }));
  const config = Object.fromEntries(
    points.map((point, index) => [`state${index}`, { label: point.label, color: point.color }]),
  );
  return (
    <div className="principal-pie">
      <ChartContainer
        config={config}
        className="principal-pie__chart"
        style={{ height: 168 }}
        role="img"
        aria-label={`توزیع وضعیت حضور: ${points.map((point) => `${point.label} ${point.value}`).join("، ")}`}
      >
        <PieChart accessibilityLayer>
          <RechartsPie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={62}
            paddingAngle={3}
            stroke="rgb(var(--surface-card))"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Tooltip cursor={false} content={(props) => <ChartTooltipContent {...props} />} />
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            className="fill-[rgb(var(--ink))] text-base font-black"
          >
            {total.toLocaleString("fa-IR")}
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            className="fill-[rgb(var(--muted-foreground))] text-[10px]"
          >
            ثبت حضور
          </text>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
function AttendanceLegend({ attendance }: { attendance: AttendanceData["today"] | undefined }) {
  if (!attendance) return null;
  return (
    <div className="principal-dashboard__legend">
      {[
        ["حاضر", attendance.present, "#22c55e"],
        ["غایب", attendance.absent, "#f43f5e"],
        ["تأخیر", attendance.late, "#f59e0b"],
        ["موجه", attendance.excused, "#38bdf8"],
      ].map(([label, value, color]) => (
        <span key={String(label)}>
          <i style={{ backgroundColor: String(color) }} />
          {String(label)} <b>{Number(value).toLocaleString("fa-IR")}</b>
        </span>
      ))}
    </div>
  );
}
function Radar({
  dimensions,
}: {
  dimensions: Array<{ key: string; label: string; value: number | null }>;
}) {
  const values = dimensions
    .filter((item): item is typeof item & { value: number } => item.value != null)
    .map((item) => ({ subject: item.label, value: item.value }));
  if (!values.length) return <Empty text="برای ساخت نمایه هنوز دادهٔ کافی ثبت نشده است." />;
  return (
    <ChartContainer
      config={{ participation: { label: "نسبت مشارکت", color: "#0f766e" } }}
      className="principal-radar"
      style={{ height: 260 }}
      role="img"
      aria-label="نمایهٔ تجمیعی حضور، تکلیف، مطالعه و مشارکت آزمون"
    >
      <RadarChart accessibilityLayer data={values} outerRadius="72%">
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <RechartsRadar
          name="نسبت مشارکت"
          dataKey="value"
          stroke="var(--color-participation)"
          fill="var(--color-participation)"
          fillOpacity={0.2}
          isAnimationActive={false}
        />
      </RadarChart>
    </ChartContainer>
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
