import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  BedDouble,
  CalendarCheck2,
  FileWarning,
  GitCompareArrows,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../../../shared/ui/ui";
import { useModal } from "../../../../shared/ui/modal";
import {
  listSupervisorComparisons,
  type SupervisorComparison,
} from "../../../student-life/attendance/api/attendance.api";
import type { PrincipalDashboardContract } from "../api/principal-dashboard.api";

type Lists = NonNullable<PrincipalDashboardContract["principalLists"]>;

const statusLabel = {
  matched: "مطابق",
  mismatch: "مغایرت",
  teacher_missing: "ثبت معلم نشده",
  supervisor_missing: "بررسی ناظر نشده",
};

export function PrincipalOperationalLists({
  lists,
  canReviewAttendance,
}: {
  lists?: Lists;
  canReviewAttendance: boolean;
}) {
  const modal = useModal();
  const comparisons = useQuery({
    queryKey: ["principal-supervisor-comparisons"],
    queryFn: listSupervisorComparisons,
    enabled: canReviewAttendance,
    refetchInterval: 30_000,
  });
  const openComparison = (item: SupervisorComparison) =>
    modal.open({
      title: `تطبیق حضور · ${item.className}`,
      description: `${item.bookName} · ${item.teacherName} · ${formatDate(item.sessionDate)}`,
      size: "lg",
      content: <ComparisonDetails item={item} />,
    });
  const values = lists ?? {
    teacherSessions: [],
    teacherReports: [],
    dormAttendance: [],
    teacherLeaveRequests: [],
  };
  return (
    <>
      <section className="principal-dashboard__operation-grid" aria-label="فهرست‌های عملیاتی مدیر">
        <ListCard
          icon={<CalendarCheck2 />}
          title="جلسه‌های معلم‌ها"
          description="ثبت‌های امروز کلاس‌ها"
        >
          {values.teacherSessions.map((item) => (
            <Link
              key={item.id}
              to={`/admin/attendance?section=sessions&sessionId=${encodeURIComponent(item.id)}`}
              className="principal-dashboard__operation-row"
            >
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.teacherName} · {formatDate(item.sessionDate)}
                </small>
              </span>
              <b className="text-emerald-700 dark:text-emerald-300">
                {item.present.toLocaleString("fa-IR")} ح
              </b>
              <em>{item.absent.toLocaleString("fa-IR")} غ</em>
            </Link>
          ))}
          {!values.teacherSessions.length ? (
            <Empty text="ثبت کلاسی برای امروز موجود نیست." />
          ) : null}
        </ListCard>
        <ListCard
          icon={<FileWarning />}
          title="گزارش معلم‌ها"
          description="گزارش‌های مربوط به دانش‌آموزان"
        >
          {values.teacherReports.map((item) => (
            <Link
              key={item.id}
              to="/admin/teacher-reports"
              className="principal-dashboard__operation-row"
            >
              <span>
                <strong>{item.studentName}</strong>
                <small>
                  {item.teacherName} · {formatDateTime(item.createdAt)}
                </small>
                <small className="line-clamp-1">{item.message}</small>
              </span>
              <em
                className={
                  item.seenAt ? "principal-dashboard__seen" : "principal-dashboard__unseen"
                }
              >
                {item.seenAt ? "دیده شد" : "جدید"}
              </em>
            </Link>
          ))}
          {!values.teacherReports.length ? (
            <Empty text="گزارش جدیدی از معلم‌ها وجود ندارد." />
          ) : null}
        </ListCard>
        <ListCard icon={<BedDouble />} title="حضور خوابگاه" description="جمع ثبت‌شده در هر اتاق">
          {values.dormAttendance.map((item) => (
            <Link
              key={item.id}
              to={`/admin/attendance?section=dorm&contextId=${encodeURIComponent(item.id)}`}
              className="principal-dashboard__operation-row"
            >
              <span>
                <strong>{item.name}</strong>
                <small>{item.total.toLocaleString("fa-IR")} ثبت وضعیت</small>
              </span>
              <b className="text-emerald-700 dark:text-emerald-300">
                {item.present.toLocaleString("fa-IR")} حاضر
              </b>
              <em>{item.absent.toLocaleString("fa-IR")} غایب</em>
            </Link>
          ))}
          {!values.dormAttendance.length ? (
            <Empty text="برای امروز حضور خوابگاه ثبت نشده است." />
          ) : null}
        </ListCard>
        <ListCard
          icon={<UserRoundCheck />}
          title="مرخصی و بازگشت معلم"
          description="در انتظار تصمیم مدیر"
        >
          {values.teacherLeaveRequests.map((item) => (
            <Link
              key={`${item.type}:${item.id}`}
              to="/admin/leave-requests"
              className="principal-dashboard__operation-row"
            >
              <span>
                <strong>{item.teacherName}</strong>
                <small>
                  {formatDate(item.startDate)} تا {formatDate(item.endDate)}
                </small>
              </span>
              <em
                className={
                  item.type === "return"
                    ? "principal-dashboard__return-tag"
                    : "principal-dashboard__leave-tag"
                }
              >
                {item.type === "return" ? "بازگشت" : "مرخصی"}
              </em>
            </Link>
          ))}
          {!values.teacherLeaveRequests.length ? (
            <Empty text="درخواست مرخصی یا بازگشت معلمی منتظر نیست." />
          ) : null}
        </ListCard>
      </section>
      <Card className="principal-dashboard__supervisor-timeline p-5">
        <div className="principal-dashboard__section-heading">
          <div>
            <p>نظارت زنده</p>
            <h2>تطبیق حضور ناظر با جلسه معلم</h2>
          </div>
          <GitCompareArrows aria-hidden="true" />
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          هر ۳۰ ثانیه تازه می‌شود. برای دیدن اختلاف دانش‌آموزان، یک مورد را باز کنید.
        </p>
        {comparisons.isError ? (
          <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">
            گزارش ناظر دریافت نشد.
          </p>
        ) : null}
        <ol className="principal-dashboard__timeline">
          {(comparisons.data ?? []).slice(0, 10).map((item) => (
            <li key={item.sessionId}>
              <button type="button" onClick={() => openComparison(item)}>
                <time>{formatDate(item.sessionDate)}</time>
                <span>
                  <strong>{item.className}</strong>
                  <small>
                    {item.bookName} · {item.teacherName}
                  </small>
                </span>
                <em className={`principal-dashboard__comparison-${item.comparisonStatus}`}>
                  {statusLabel[item.comparisonStatus]}
                </em>
              </button>
            </li>
          ))}
        </ol>
        {!comparisons.isLoading && !comparisons.data?.length ? (
          <Empty text="جلسه نظارتی قابل تطبیقی وجود ندارد." />
        ) : null}
      </Card>
    </>
  );
}

function ListCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="principal-dashboard__operation-card p-4">
      <div className="principal-dashboard__section-heading">
        <div>
          <p>{description}</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <div className="principal-dashboard__operation-list">{children}</div>
    </Card>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm text-slate-600 dark:text-slate-300">
      {text}
    </p>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(value));
}
function ComparisonDetails({ item }: { item: SupervisorComparison }) {
  const byStudent = new Map(item.roster.map((student) => [student.id, student.name]));
  const mismatches = item.supervisorChecks.flatMap((check) =>
    check.mismatches.map((difference) => ({ ...difference, supervisorName: check.supervisorName })),
  );
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
          <small>ثبت معلم</small>
          <strong className="block text-lg">
            {item.teacherRecordCount.toLocaleString("fa-IR")}
          </strong>
        </div>
        <div className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
          <small>اختلاف</small>
          <strong className="block text-lg">{mismatches.length.toLocaleString("fa-IR")}</strong>
        </div>
      </div>
      {mismatches.length ? (
        <ul className="grid max-h-[45dvh] gap-2 overflow-y-auto">
          {mismatches.map((difference) => (
            <li
              key={`${difference.supervisorName}:${difference.studentId}`}
              className="rounded-xl border border-[rgb(var(--border-subtle))] p-3"
            >
              <strong>{byStudent.get(difference.studentId) ?? "دانش‌آموز"}</strong>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                معلم: {difference.teacherStatus ?? "ثبت نشده"} · ناظر: {difference.supervisorStatus}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="بین ثبت معلم و ناظر اختلافی وجود ندارد." />
      )}
    </div>
  );
}
