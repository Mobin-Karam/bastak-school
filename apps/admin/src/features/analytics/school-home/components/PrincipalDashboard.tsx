import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
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
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie as RechartsPie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../../identity/auth";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { ChartContainer, ChartTooltipContent } from "../../../../shared/ui/chart-container";
import "./principal-dashboard-layout.css";
import {
  getPrincipalDashboard,
  getAttendanceSessionForReview,
  reviewAttendanceSession,
  type PrincipalDashboardContract,
} from "../api/principal-dashboard.api";

type Point = { label: string; value: number; color: string };
type AttendanceData = NonNullable<PrincipalDashboardContract["attendance"]>;

export function PrincipalDashboard() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [classId, setClassId] = useState("");
  const [reviewingItem, setReviewingItem] = useState<
    NonNullable<PrincipalDashboardContract["sessionReviews"]>["items"][number] | null
  >(null);
  const dashboard = useQuery({
    queryKey: ["principal-dashboard", range, classId, auth.context?.activeOrganization?.id],
    queryFn: () => getPrincipalDashboard(range, classId || undefined),
  });
  const reviewSession = useMutation({
    mutationFn: reviewAttendanceSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["principal-dashboard"] }),
  });
  const sessionDetail = useQuery({
    queryKey: ["principal-attendance-review-detail", reviewingItem?.id],
    queryFn: () => getAttendanceSessionForReview(reviewingItem!.id),
    enabled: Boolean(reviewingItem),
  });
  if (dashboard.isLoading) return <LoadingState label="در حال آماده‌سازی داشبورد مدیریت…" />;
  if (dashboard.isError || !dashboard.data)
    return <DashboardError onRetry={() => void dashboard.refetch()} />;
  const data = dashboard.data;
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
      <header className="principal-dashboard__hero">
        <div>
          <p className="principal-dashboard__eyebrow">میز مدیریت مدرسه</p>
          <h1>تصمیم‌های امروز، با تصویر روشن از مدرسه</h1>
          <p>
            شاخص‌ها فقط برای مدرسهٔ فعال شما محاسبه شده‌اند و هر بخش بر اساس سطح دسترسی نمایش داده
            می‌شود.
          </p>
        </div>
        <div className="principal-dashboard__controls" aria-label="بازه گزارش">
          <button
            type="button"
            className={range === "7d" ? "is-active" : ""}
            onClick={() => setRange("7d")}
          >
            ۷ روز
          </button>
          <button
            type="button"
            className={range === "30d" ? "is-active" : ""}
            onClick={() => setRange("30d")}
          >
            ۳۰ روز
          </button>
          {attendance?.classes.length ? (
            <AdaptiveSelect
              aria-label="فیلتر کلاس"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">همهٔ کلاس‌ها</option>
              {attendance.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </AdaptiveSelect>
          ) : null}
          <span>
            به‌روزرسانی:{" "}
            {new Date(data.generatedAt).toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </header>

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
          {data.sessionReviews.items.length ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {data.sessionReviews.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-[rgb(var(--border-subtle))] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.sessionDate).toLocaleString("fa-IR", {
                          timeZone: "Asia/Tehran",
                        })}
                        {item.lastReviewedAt
                          ? ` · آخرین بازبینی ${new Date(item.lastReviewedAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}`
                          : " · هنوز بازبینی نشده"}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                      {item.status === "submitted" ? "ثبت‌شده" : "نهایی‌شده"}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {[
                      ["حاضر", item.present],
                      ["غایب", item.absent],
                      ["تأخیر", item.late],
                      [
                        "ثبت وضعیت",
                        item.expected == null ? item.marked : `${item.marked} از ${item.expected}`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-[rgb(var(--surface-muted))] p-2">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="mt-1 font-black">
                          {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    className="mt-3 min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50"
                    disabled={reviewSession.isPending || Boolean(reviewingItem)}
                    onClick={() => {
                      if (item.absent === 0) reviewSession.mutate(item.id);
                      else setReviewingItem(item);
                    }}
                  >
                    {reviewSession.isPending && reviewSession.variables === item.id
                      ? "در حال ثبت بازبینی…"
                      : item.absent === 0
                        ? "تأیید بازبینی و ثبت"
                        : `مشاهدهٔ جزئیات ${item.absent.toLocaleString("fa-IR")} غایب`}
                  </button>
                </li>
              ))}
            </ul>
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

      <ResponsiveModal
        open={Boolean(reviewingItem)}
        onOpenChange={(open) => {
          if (!open && !reviewSession.isPending) setReviewingItem(null);
        }}
        title="جزئیات غیبت‌های جلسه"
        description={reviewingItem?.title ?? "جلسه حضور"}
        size="wide"
      >
        {reviewingItem ? (
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
                  <ReviewCount label="غایب" value={reviewingItem.absent} />
                  <ReviewCount label="حاضر" value={reviewingItem.present} />
                  <ReviewCount label="تأخیر" value={reviewingItem.late} />
                  <ReviewCount label="ثبت‌نشده" value={sessionDetail.data.unmarked ?? 0} />
                </div>
                <div className="grid gap-2">
                  <h3 className="font-bold">دانش‌آموزان ثبت‌شده به‌عنوان غایب</h3>
                  {sessionDetail.data.records.filter((record) => record.physicalStatus === "absent")
                    .length ? (
                    <ul className="grid max-h-[45dvh] gap-2 overflow-y-auto">
                      {sessionDetail.data.records
                        .filter((record) => record.physicalStatus === "absent")
                        .map((record) => {
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
                {sessionDetail.data.records.some((record) => record.physicalStatus === "absent") ? (
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="min-h-11 rounded-xl border border-[rgb(var(--border-subtle))] px-4 font-semibold"
                      disabled={reviewSession.isPending}
                      onClick={() => setReviewingItem(null)}
                    >
                      بازگشت
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded-xl bg-brand px-4 font-bold text-white disabled:opacity-50"
                      disabled={reviewSession.isPending}
                      onClick={() => reviewSession.mutate(reviewingItem.id)}
                    >
                      {reviewSession.isPending
                        ? "در حال ثبت بازبینی…"
                        : "جزئیات را بررسی و تأیید می‌کنم"}
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
        ) : null}
      </ResponsiveModal>

      {attendance ? (
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
      ) : null}

      <section className="principal-dashboard__metrics grid gap-3" aria-label="عملیات مدرسه">
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
      </section>
    </main>
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
function RadialBars({ classes }: { classes: AttendanceData["classes"] }) {
  return (
    <div className="principal-radials">
      {classes.length ? (
        classes.map((item) => (
          <div key={item.id}>
            <ChartContainer
              config={{ completion: { label: "تکمیل ثبت", color: "#0f766e" } }}
              className="principal-radials__chart"
              style={{ height: 64, width: 64 }}
              role="img"
              aria-label={`${item.name}: ${item.rate == null ? "بدون داده" : `${item.rate} درصد تکمیل`}`}
            >
              <RadialBarChart
                data={[{ name: item.name, value: item.rate ?? 0 }]}
                innerRadius="72%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                barSize={9}
              >
                <RadialBar
                  dataKey="value"
                  background
                  cornerRadius={8}
                  fill="var(--color-completion)"
                  isAnimationActive={false}
                />
              </RadialBarChart>
            </ChartContainer>
            <span>
              <strong>{item.rate == null ? "—" : `${item.rate.toLocaleString("fa-IR")}٪`}</strong>
              <small>{item.name}</small>
              <small>
                {item.marked.toLocaleString("fa-IR")} / {item.expected.toLocaleString("fa-IR")}{" "}
                ثبت‌شده
              </small>
            </span>
          </div>
        ))
      ) : (
        <Empty text="در این بازه کلاسی ثبت نشده است." />
      )}
    </div>
  );
}
function Trend({ rows }: { rows: AttendanceData["trend"] }) {
  const config = {
    present: { label: "حاضر", color: "#0f766e" },
    absent: { label: "غایب", color: "#e11d48" },
  };
  return (
    <div className="principal-trend">
      {rows.length ? (
        <ChartContainer
          config={config}
          className="principal-trend__chart"
          style={{ height: 210 }}
          role="img"
          aria-label="روند روزانهٔ تعداد افراد حاضر و غایب"
        >
          <AreaChart
            accessibilityLayer
            data={rows}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date: string) => date.slice(5).replace("-", "/")}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip cursor={false} content={(props) => <ChartTooltipContent {...props} />} />
            <Area
              type="monotone"
              dataKey="present"
              name="حاضر"
              stroke="var(--color-present)"
              fill="var(--color-present)"
              fillOpacity={0.16}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="absent"
              name="غایب"
              stroke="var(--color-absent)"
              fill="var(--color-absent)"
              fillOpacity={0.08}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <Empty text="داده‌ای برای روند حضور نیست." />
      )}
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  visible,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number | undefined;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <Card className="principal-dashboard__metric p-4">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{(value ?? 0).toLocaleString("fa-IR")}</strong>
    </Card>
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
