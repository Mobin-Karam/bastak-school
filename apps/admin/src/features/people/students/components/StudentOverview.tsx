import { AlertTriangle, CheckCircle2, Mail, Phone, UserRound, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { Student } from "../../../../shared/types/domain";
import { useAuth } from "../../../identity/auth";
import { getAttendanceProfile } from "../../../student-life/attendance/api/attendance-operations.api";
import { Button } from "../../../../shared/ui/ui";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";
import type { StudentProfile } from "../api/students.api";
import {
  formatStudentLastSeen,
  getMissingStudentProfileFields,
  getStudentProfileCompleteness,
  getStudentStatus,
  getStudentStatusCopy,
  getStudentUsername,
} from "./student-ui";

export function StudentOverview({
  student,
  overview,
  profile,
  loading,
  error,
  onRetry,
  onEdit,
}: {
  student: Student;
  overview?: Student;
  profile?: StudentProfile;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: () => void;
}) {
  const language = useOptionalAdminLanguage() ?? "fa";
  const copy = studentCopy[language];
  const locale = language === "en" ? "en-US" : "fa-IR";
  const record = overview ?? student;
  const profileRecord = profile ?? null;
  const auth = useAuth();
  const attendanceScope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const canViewAttendance = auth.can("attendance.review") || auth.can("attendance.class.read");
  const canReadStudentProfile = auth.can("students.read");
  const completeness = getStudentProfileCompleteness(record);
  const missing = getMissingStudentProfileFields(record, language);
  const status = getStudentStatusCopy(getStudentStatus(record), language);
  const profileRows = [
    [language === "fa" ? "شناسه دانش‌آموز" : "Student ID", record.id, true],
    [copy.username, getStudentUsername(record), true],
    [language === "fa" ? "کد ملی" : "National ID", profileRecord?.identity.nationalCode, true],
    [
      copy.gradeAndTrack,
      [
        profileRecord?.education.grade || record.grade,
        profileRecord?.education.major || record.major,
      ]
        .filter(Boolean)
        .join(" / "),
      false,
    ],
    [language === "fa" ? "کلاس" : "Class", profileRecord?.className ?? record.className, false],
    [
      language === "fa" ? "مدرسه" : "School",
      profileRecord?.governmentSchool ?? record.governmentSchool,
      false,
    ],
    [
      language === "fa" ? "سازمان" : "Organization",
      profileRecord?.organization?.name ?? record.organization?.name,
      false,
    ],
    [
      language === "fa" ? "تلفن همراه" : "Phone",
      profileRecord?.identity.phoneNumber ?? record.phoneNumber,
      true,
    ],
    [language === "fa" ? "رایانامه" : "Email", profileRecord?.identity.email, true],
  ].flatMap(([label, value, ltr]) =>
    value ? [[label, value, ltr] as [string, string, boolean]] : [],
  );

  return (
    <section className="grid gap-3" aria-labelledby="student-overview-title">
      <h3 id="student-overview-title" className="sr-only">
        {copy.overviewTitle}
      </h3>
      <header className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          {profileRecord?.identity.profilePhoto ? (
            <img
              src={profileRecord.identity.profilePhoto}
              alt=""
              className="size-14 rounded-xl object-cover ring-1 ring-[rgb(var(--border-subtle))]"
            />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-[rgb(var(--surface-muted))] text-brand">
              <UserRound size={25} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="student-overview-heading" className="text-lg font-black text-ink">
                {profileRecord?.identity.fullName || record.name}
              </h3>
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                profileRecord?.education.grade || record.grade,
                profileRecord?.education.major || record.major,
              ]
                .filter(Boolean)
                .join(" · ") || copy.overviewDescription}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profileRecord?.identity.phoneNumber ? (
                <a
                  href={`tel:${profileRecord.identity.phoneNumber}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[rgb(var(--surface-muted))] px-2.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand"
                  dir="ltr"
                >
                  <Phone size={14} aria-hidden="true" /> {profileRecord.identity.phoneNumber}
                </a>
              ) : null}
              {profileRecord?.identity.email ? (
                <a
                  href={`mailto:${profileRecord.identity.email}`}
                  className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg bg-[rgb(var(--surface-muted))] px-2.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-brand"
                  dir="ltr"
                >
                  <Mail size={14} aria-hidden="true" />
                  <span className="truncate">{profileRecord.identity.email}</span>
                </a>
              ) : null}
            </div>
          </div>
          {onEdit ? (
            <Button variant="soft" className="h-10" onClick={onEdit}>
              {copy.editProfile}
            </Button>
          ) : null}
        </div>
      </header>
      <section
        className="overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]"
        aria-labelledby="student-facts-heading"
      >
        <div className="border-b border-[rgb(var(--border-subtle))] px-4 py-3">
          <h4 id="student-facts-heading" className="text-sm font-bold text-ink">
            {language === "fa" ? "اطلاعات پرونده" : "Student record"}
          </h4>
        </div>
        <dl className="grid gap-x-5 px-4 sm:grid-cols-2">
          {profileRows.map(([label, value, ltr]) => (
            <div
              key={label}
              className="grid min-w-0 grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-[rgb(var(--border-subtle))] py-2.5 sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd
                className="min-w-0 truncate text-end text-sm font-semibold text-ink"
                dir={ltr ? "ltr" : undefined}
                title={value}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {canReadStudentProfile && profileRecord?.attendanceSummary ? (
        <AttendanceSummary summary={profileRecord.attendanceSummary} language={language} />
      ) : null}

      {canReadStudentProfile && profileRecord ? (
        <AttendanceHistoryTable rows={profileRecord?.recentAttendance ?? []} language={language} />
      ) : null}

      <section
        className="overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]"
        aria-labelledby="student-guardians-heading"
      >
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border-subtle))] px-4 py-3">
          <UsersRound size={16} className="text-brand" aria-hidden="true" />
          <h4 id="student-guardians-heading" className="text-sm font-bold text-ink">
            {language === "fa" ? "سرپرست‌های پیوندخورده" : "Linked guardians"}
          </h4>
        </div>
        {student.guardians?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-start text-sm">
              <thead className="bg-[rgb(var(--surface-muted))] text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    {language === "fa" ? "نام سرپرست" : "Guardian"}
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    {language === "fa" ? "شماره تماس" : "Phone"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-subtle))]">
                {student.guardians.map((guardian) => (
                  <tr key={guardian.id}>
                    <th scope="row" className="px-4 py-2.5 text-start font-semibold text-ink">
                      {guardian.name}
                    </th>
                    <td className="px-4 py-2.5 text-muted-foreground" dir="ltr">
                      {guardian.phoneNumber || (language === "fa" ? "ثبت نشده" : "Not provided")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-3 text-xs text-muted-foreground">
            {language === "fa"
              ? "سرپرستی برای این دانش‌آموز پیوند نخورده است."
              : "No guardian is linked to this student."}
          </p>
        )}
      </section>

      {canViewAttendance ? (
        <StudentAttendanceInsights
          studentId={student.id}
          scope={attendanceScope}
          language={language}
        />
      ) : null}

      <div className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <span>
            <strong className="block text-sm text-ink">{copy.recordStatus}</strong>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              {missing.length
                ? `${missing.length.toLocaleString(locale)} ${copy.fieldsRemaining}`
                : copy.profileComplete}
            </span>
          </span>
          <strong className="text-xl text-brand">
            {language === "fa" ? "٪" : ""}
            {completeness.toLocaleString(locale)}
            {language === "en" ? "%" : ""}
          </strong>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-label={copy.profileCompletion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completeness}
        >
          <span
            className="block h-full rounded-full bg-brand"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {missing.length ? (
          <div className="flex flex-wrap gap-1.5">
            {missing.map((field) => (
              <span
                key={field}
                className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              >
                {field}
              </span>
            ))}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} />
            {copy.profileFieldsComplete}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {copy.lastActivity}
          </span>
          <strong className="mt-1 block text-sm text-ink">
            {formatStudentLastSeen(student.last_seen_at, language)}
          </strong>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {language === "fa" ? "سازمان مربوط" : "Organization"}
          </span>
          {loading ? (
            <div className="mt-2 h-5 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : error ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle size={13} />
                {copy.loadFailed}
              </span>
              {onRetry ? (
                <button type="button" className="text-xs font-bold text-brand" onClick={onRetry}>
                  {copy.retry}
                </button>
              ) : null}
            </div>
          ) : (
            <strong className="mt-1 block text-sm text-ink">
              {record.organization?.name || (language === "fa" ? "—" : "—")}
            </strong>
          )}
        </div>
      </div>
    </section>
  );
}

function AttendanceSummary({
  summary,
  language,
}: {
  summary: StudentProfile["attendanceSummary"];
  language: "fa" | "en";
}) {
  const locale = language === "fa" ? "fa-IR" : "en-US";
  const total = summary.totalSessions;
  const rate = total ? Math.round(((summary.present + summary.late) / total) * 100) : null;
  return (
    <section
      className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4"
      aria-label={language === "fa" ? "خلاصه حضور دانش‌آموز" : "Student attendance summary"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-ink">
            {language === "fa" ? "خلاصه حضور" : "Attendance summary"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {total.toLocaleString(locale)}{" "}
            {language === "fa" ? "جلسهٔ ثبت‌شده" : "recorded sessions"}
          </p>
        </div>
        <strong className="text-2xl font-black text-brand">
          {rate === null ? "—" : `${rate.toLocaleString(locale)}٪`}
        </strong>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [
            language === "fa" ? "حاضر" : "Present",
            summary.present,
            "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300",
          ],
          [
            language === "fa" ? "غایب" : "Absent",
            summary.absent,
            "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300",
          ],
          [
            language === "fa" ? "تأخیر" : "Late",
            summary.late,
            "text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300",
          ],
          [
            language === "fa" ? "موجه" : "Excused",
            summary.excused,
            "text-sky-700 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-300",
          ],
        ].map(([label, value, tone]) => (
          <div key={String(label)} className={`rounded-xl p-3 ${tone}`}>
            <div className="text-xs">{label}</div>
            <div className="mt-1 text-lg font-black">{Number(value).toLocaleString(locale)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AttendanceHistoryTable({
  rows,
  language,
}: {
  rows: StudentProfile["recentAttendance"];
  language: "fa" | "en";
}) {
  const isFa = language === "fa";
  const locale = isFa ? "fa-IR" : "en-US";
  const labels: Record<string, { label: string; className: string }> = {
    present: {
      label: isFa ? "حاضر" : "Present",
      className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    },
    absent: {
      label: isFa ? "غایب" : "Absent",
      className: "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    },
    late: {
      label: isFa ? "تأخیر" : "Late",
      className: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    },
    excused: {
      label: isFa ? "موجه" : "Excused",
      className: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
    },
  };
  return (
    <section
      className="overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]"
      aria-labelledby="student-attendance-history-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[rgb(var(--border-subtle))] px-4 py-3">
        <h4 id="student-attendance-history-heading" className="text-sm font-bold text-ink">
          {isFa ? "آخرین سوابق حضور" : "Recent attendance"}
        </h4>
        <span className="text-xs text-muted-foreground">
          {isFa ? "۱۰ جلسه اخیر" : "Latest 10 sessions"}
        </span>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[31rem] text-start text-sm">
            <caption className="sr-only">
              {isFa
                ? "آخرین وضعیت‌های ثبت‌شده حضور دانش‌آموز"
                : "Latest recorded student attendance statuses"}
            </caption>
            <thead className="bg-[rgb(var(--surface-muted))] text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {isFa ? "تاریخ جلسه" : "Session date"}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {isFa ? "وضعیت" : "Status"}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {isFa ? "نوع بخش" : "Section type"}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {isFa ? "شناسه جلسه" : "Session ID"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border-subtle))]">
              {rows.map((row) => {
                const status = labels[row.status] ?? {
                  label: row.status,
                  className: "bg-[rgb(var(--surface-muted))] text-ink",
                };
                return (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                      {new Date(row.sessionDate).toLocaleDateString(locale, {
                        timeZone: "Asia/Tehran",
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {row.contextType === "dorm"
                        ? isFa
                          ? "خوابگاه"
                          : "Dormitory"
                        : row.contextType === "class_group"
                          ? isFa
                            ? "گروه کلاسی"
                            : "Class group"
                          : isFa
                            ? "کلاس"
                            : "Class"}
                    </td>
                    <td
                      className="max-w-36 truncate px-4 py-2.5 text-xs text-muted-foreground"
                      dir="ltr"
                      title={row.sessionId}
                    >
                      {row.sessionId}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          {isFa ? "هنوز سابقه حضور ثبت نشده است." : "No attendance records yet."}
        </p>
      )}
    </section>
  );
}

function StudentAttendanceInsights({
  studentId,
  scope,
  language,
}: {
  studentId: string;
  scope: string;
  language: "fa" | "en";
}) {
  const attendance = useQuery({
    queryKey: ["attendance-profile", scope, studentId],
    queryFn: () => getAttendanceProfile(studentId),
  });
  const profile = attendance.data;
  const loading = attendance.isLoading;
  const error = attendance.isError;
  const onRetry = () => void attendance.refetch();
  const isFa = language === "fa";
  const locale = isFa ? "fa-IR" : "en-US";
  const chartData = profile
    ? [
        { metric: isFa ? "حضور" : "Present", value: profile.attendanceRate ?? 0 },
        {
          metric: isFa ? "تکمیل ثبت" : "Coverage",
          value: profile.attendanceCoverage ?? 0,
        },
        {
          metric: isFa ? "بدون غیبت" : "No absences",
          value: profile.totalSessions
            ? Math.round(
                ((profile.totalSessions - profile.counts.absent) / profile.totalSessions) * 100,
              )
            : 0,
        },
        {
          metric: isFa ? "به‌موقع" : "On time",
          value: profile.totalSessions
            ? Math.round((profile.counts.present / profile.totalSessions) * 100)
            : 0,
        },
      ]
    : [];
  const gauge = profile?.attendanceRate ?? 0;

  return (
    <section
      className="space-y-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-card p-4"
      aria-labelledby="student-attendance-insights"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="student-attendance-insights" className="text-sm font-black text-ink">
            {isFa ? "رفتار حضور و غیاب" : "Attendance insights"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {profile?.scopedToTeacherClasses
              ? isFa
                ? "بر پایه کلاس‌های واگذارشده به شما"
                : "Based on classes assigned to you"
              : isFa
                ? "مبنای آمار، جلسه‌های مجاز این دانش‌آموز است."
                : "Based on sessions this student is authorized for."}
          </p>
        </div>
        {profile?.totalSessions ? (
          <span className="rounded-full bg-[rgb(var(--surface-muted))] px-3 py-1.5 text-xs font-bold text-ink">
            {profile.totalSessions.toLocaleString(locale)} {isFa ? "جلسه" : "sessions"}
          </span>
        ) : null}
      </header>

      {!loading && !error && profile ? (
        <div className="relative isolate flex min-h-36 items-center justify-between gap-4 overflow-hidden rounded-xl border border-amber-300/70 bg-[linear-gradient(110deg,#fffaf0,#fef3c7)] px-4 py-3 text-amber-950 shadow-sm dark:border-amber-800/70 dark:bg-[linear-gradient(110deg,#272016,#3b2b12)] dark:text-amber-100 sm:px-6">
          <div className="relative z-10 min-w-0">
            <p className="text-xs font-semibold opacity-80">
              {isFa ? "امتیاز حضور و رفتار" : "Attendance and behavior points"}
            </p>
            <strong className="mt-1 block text-3xl font-black tracking-tight" dir="ltr">
              {profile.points.toLocaleString(locale)}
            </strong>
            <p className="mt-1 text-xs opacity-75">
              {isFa
                ? "مجموع امتیازهای ثبت‌شده برای این دانش‌آموز"
                : "Total points recorded for this student"}
            </p>
          </div>
          <div
            className="relative me-1 grid size-28 shrink-0 place-items-center [perspective:700px] sm:size-32"
            aria-hidden="true"
          >
            <span className="absolute inset-x-3 bottom-2 h-5 rounded-[50%] bg-amber-900/25 blur-md" />
            <img
              src="/images/mascots/zanin-coin.svg"
              alt=""
              className="relative size-28 object-contain drop-shadow-[0_12px_10px_rgba(90,52,4,0.38)] transition-transform duration-300 motion-safe:hover:[transform:perspective(700px)_rotateY(-14deg)_rotateX(9deg)_translateY(-2px)] motion-reduce:transition-none sm:size-32"
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <p
          role="status"
          className="rounded-xl bg-[rgb(var(--surface-muted))] p-4 text-sm text-slate-600"
        >
          {isFa ? "در حال دریافت آمار حضور…" : "Loading attendance insights…"}
        </p>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <span>{isFa ? "آمار حضور دریافت نشد." : "Attendance insights could not be loaded."}</span>
          <Button variant="soft" size="sm" onClick={onRetry}>
            {isFa ? "تلاش دوباره" : "Retry"}
          </Button>
        </div>
      ) : profile?.totalSessions ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <article
              className="min-w-0 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
              aria-label={isFa ? "درصد حضور" : "Attendance rate"}
            >
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isFa ? "درصد حضور" : "Attendance rate"}
              </h4>
              <div className="relative mx-auto mt-2 h-36 w-full max-w-[18rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="72%">
                    <PolarGrid stroke="var(--chart-grid, #cbd5e1)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "var(--chart-label, #475569)", fontSize: 11 }}
                    />
                    <Radar
                      dataKey="value"
                      name={isFa ? "درصد" : "Percent"}
                      stroke="#0f766e"
                      fill="#14b8a6"
                      fillOpacity={0.28}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs text-slate-600 dark:text-slate-300">
                {isFa ? "مقایسه شاخص‌های ثبت‌شده" : "Recorded attendance indicators"}
              </p>
            </article>
            <article
              className="min-w-0 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
              aria-label={isFa ? "گیج درصد حضور" : "Attendance gauge"}
            >
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isFa ? "حضور مؤثر" : "Effective attendance"}
              </h4>
              <div className="relative mx-auto mt-2 h-36 w-full max-w-[18rem]">
                <svg
                  viewBox="0 0 240 150"
                  className="h-full w-full"
                  role="img"
                  aria-label={`${isFa ? "درصد حضور" : "Attendance rate"}: ${gauge.toLocaleString(locale)}%`}
                >
                  <path
                    d="M 30 125 A 90 90 0 0 1 210 125"
                    fill="none"
                    stroke="var(--chart-grid, #e2e8f0)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    pathLength="100"
                  />
                  <path
                    d="M 30 125 A 90 90 0 0 1 210 125"
                    fill="none"
                    stroke={gauge >= 85 ? "#0f766e" : gauge >= 65 ? "#d97706" : "#e11d48"}
                    strokeWidth="18"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${gauge} 100`}
                  />
                  <text
                    x="120"
                    y="105"
                    textAnchor="middle"
                    className="fill-slate-900 text-[28px] font-black dark:fill-slate-100"
                  >
                    {gauge.toLocaleString(locale)}٪
                  </text>
                  <text
                    x="120"
                    y="129"
                    textAnchor="middle"
                    className="fill-slate-600 text-[11px] dark:fill-slate-300"
                  >
                    {isFa ? "حاضر یا با تأخیر" : "Present or late"}
                  </text>
                </svg>
              </div>
            </article>
          </div>
          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {isFa
              ? "شاخص‌های رفتاری فقط از رکوردهای مجاز حضور محاسبه شده‌اند؛ امتیاز ثبت‌نشده به‌عنوان غیبت محسوب نمی‌شود."
              : "Indicators use only authorized attendance records; an unrecorded session is not treated as an absence."}
          </p>
        </>
      ) : (
        <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-4 text-sm text-slate-600 dark:text-slate-300">
          {isFa
            ? "هنوز داده کافی برای تحلیل حضور ثبت نشده است."
            : "There is not enough attendance data to analyze yet."}
        </p>
      )}
    </section>
  );
}
