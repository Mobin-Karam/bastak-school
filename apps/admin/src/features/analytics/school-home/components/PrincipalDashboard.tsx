import { useQuery } from "@tanstack/react-query";
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
import { useAuth } from "../../../identity/auth";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import {
  getPrincipalDashboard,
  type PrincipalDashboardContract,
} from "../api/principal-dashboard.api";

type Point = { label: string; value: number; color: string };
type AttendanceData = NonNullable<PrincipalDashboardContract["attendance"]>;

export function PrincipalDashboard() {
  const auth = useAuth();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const dashboard = useQuery({
    queryKey: ["principal-dashboard", range, auth.context?.activeOrganization?.id],
    queryFn: () => getPrincipalDashboard(range),
  });
  if (dashboard.isLoading) return <LoadingState label="در حال آماده‌سازی داشبورد مدیریت…" />;
  if (dashboard.isError || !dashboard.data)
    return <DashboardError onRetry={() => void dashboard.refetch()} />;
  const data = dashboard.data;
  const attendance = data.attendance;
  const queues = data.queues;
  const operations = data.operations;
  const totalAttendance = attendance
    ? attendance.present + attendance.absent + attendance.late + attendance.excused
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
          <span>
            به‌روزرسانی:{" "}
            {new Date(data.generatedAt).toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]" aria-label="وضعیت حضور">
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
              <Gauge value={attendance.rate} label="نرخ حضور" />
              <Pie
                points={[
                  { label: "حاضر", value: attendance.present, color: "#22c55e" },
                  { label: "غایب", value: attendance.absent, color: "#f43f5e" },
                  { label: "تأخیر", value: attendance.late, color: "#f59e0b" },
                  { label: "موجه", value: attendance.excused, color: "#38bdf8" },
                ]}
                total={totalAttendance}
              />
            </div>
            <AttendanceLegend attendance={attendance} />
          </Card>
        ) : (
          <LockedSection title="وضعیت حضور" capability="گزارش یا بررسی حضور" />
        )}
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]" aria-label="رفتار و پیشرفت">
        {data.behaviour ? (
          <Card className="p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>رفتار و پیشرفت</p>
                <h2>نمایهٔ یادگیری دانش‌آموزان</h2>
              </div>
              <GraduationCap aria-hidden="true" />
            </div>
            <div className="principal-dashboard__behaviour-grid">
              <Radar dimensions={data.behaviour.dimensions} />
              <div className="principal-dashboard__radar-notes">
                {data.behaviour.dimensions.map((item) => (
                  <div key={item.key}>
                    <span>{item.label}</span>
                    <strong>
                      {item.value == null ? "—" : `${item.value.toLocaleString("fa-IR")}٪`}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            <p className="principal-dashboard__chart-note">
              این نما یک شاخص تجمیعی است، نه ارزیابی فردی. برای اقدام، فهرست نیازمند توجه را باز
              کنید.
            </p>
          </Card>
        ) : (
          <LockedSection title="رفتار و پیشرفت" capability="تحلیل دانش‌آموزان" />
        )}
        {data.behaviour ? (
          <Card className="p-5">
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

      {attendance ? (
        <section
          className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]"
          aria-label="پوشش کلاس و روند حضور"
        >
          <Card className="p-5">
            <div className="principal-dashboard__section-heading">
              <div>
                <p>پوشش کلاس‌ها</p>
                <h2>تکمیل ثبت حضور</h2>
              </div>
              <CheckCircle2 aria-hidden="true" />
            </div>
            <RadialBars classes={attendance.classes} />
          </Card>
          <Card className="p-5">
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="عملیات مدرسه">
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
          visible={auth.can("dormitory.read")}
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

function Gauge({ value, label }: { value: number | null; label: string }) {
  const safe = value ?? 0;
  const dash = `${safe} ${100 - safe}`;
  return (
    <div className="principal-gauge" aria-label={`${label}: ${value ?? "نامشخص"} درصد`}>
      <svg viewBox="0 0 120 70" aria-hidden="true">
        <path d="M15 60a45 45 0 0 1 90 0" pathLength="100" />
        <path
          className="principal-gauge__value"
          d="M15 60a45 45 0 0 1 90 0"
          pathLength="100"
          strokeDasharray={dash}
        />
      </svg>
      <strong>{value == null ? "—" : `${value.toLocaleString("fa-IR")}٪`}</strong>
      <span>{label}</span>
    </div>
  );
}
function Pie({ points, total }: { points: Point[]; total: number }) {
  let cursor = 0;
  return (
    <div className="principal-pie" aria-label="توزیع وضعیت حضور">
      <svg viewBox="0 0 42 42" role="img">
        <title>توزیع وضعیت حضور</title>
        {points.map((point) => {
          const part = total ? (point.value / total) * 100 : 0;
          const dash = `${part} ${100 - part}`;
          const offset = 25 - cursor;
          cursor += part;
          return (
            <circle
              key={point.label}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={point.color}
              strokeWidth="7"
              pathLength="100"
              strokeDasharray={dash}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <strong>{total.toLocaleString("fa-IR")}</strong>
      <span>ثبت حضور</span>
    </div>
  );
}
function AttendanceLegend({ attendance }: { attendance: AttendanceData }) {
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
  const points = dimensions
    .map((item, index) => {
      const angle = -Math.PI / 2 + index * ((2 * Math.PI) / dimensions.length);
      const radius = (item.value ?? 0) * 0.38 + 8;
      return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
    })
    .join(" ");
  return (
    <svg className="principal-radar" viewBox="0 0 100 100" role="img">
      <title>نمایه رفتار و پیشرفت</title>
      {[20, 35, 50].map((radius) => (
        <circle key={radius} cx="50" cy="50" r={radius} />
      ))}
      {dimensions.map((item, index) => {
        const angle = -Math.PI / 2 + index * ((2 * Math.PI) / dimensions.length);
        return (
          <line
            key={item.key}
            x1="50"
            y1="50"
            x2={50 + Math.cos(angle) * 50}
            y2={50 + Math.sin(angle) * 50}
          />
        );
      })}
      <polygon points={points} />
    </svg>
  );
}
function RadialBars({ classes }: { classes: AttendanceData["classes"] }) {
  return (
    <div className="principal-radials">
      {classes.length ? (
        classes.map((item) => (
          <div key={item.id}>
            <svg viewBox="0 0 42 42" aria-hidden="true">
              <circle cx="21" cy="21" r="15.915" />
              <circle
                className="principal-radials__value"
                cx="21"
                cy="21"
                r="15.915"
                pathLength="100"
                strokeDasharray={`${item.rate ?? 0} ${100 - (item.rate ?? 0)}`}
              />
            </svg>
            <span>
              <strong>{(item.rate ?? 0).toLocaleString("fa-IR")}٪</strong>
              <small>{item.name}</small>
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
  const max = Math.max(1, ...rows.map((row) => row.present + row.absent + row.late + row.excused));
  return (
    <div className="principal-trend">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.date} title={`${row.date}: ${row.present} حاضر، ${row.absent} غایب`}>
            <span style={{ height: `${(row.present / max) * 100}%` }} />
            <i style={{ height: `${(row.absent / max) * 100}%` }} />
            <small>{row.date.slice(5).replace("-", "/")}</small>
          </div>
        ))
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
function LockedSection({ title, capability }: { title: string; capability: string }) {
  return (
    <Card className="principal-dashboard__locked p-5">
      <AlertTriangle aria-hidden="true" />
      <h2>{title}</h2>
      <p>برای نمایش این بخش، دسترسی «{capability}» لازم است.</p>
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
