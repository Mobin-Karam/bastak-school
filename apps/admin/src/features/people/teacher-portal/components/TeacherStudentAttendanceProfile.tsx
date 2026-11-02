import type { TeacherStudentClassAttendanceProfile } from "@moshaver/api-contract";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { EmptyState } from "../../../../shared/ui/ui";

const statusLabels: Record<
  TeacherStudentClassAttendanceProfile["sessions"][number]["status"],
  string
> = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
  excused: "موجه",
  unmarked: "ثبت‌نشده",
};

const statusClasses: Record<
  TeacherStudentClassAttendanceProfile["sessions"][number]["status"],
  string
> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  absent: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  late: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  excused: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  unmarked: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

function formatDate(value: string) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function TeacherStudentAttendanceProfile({
  profile,
}: {
  profile: TeacherStudentClassAttendanceProfile;
}) {
  const summaries = [
    { label: "حاضر", count: profile.counts.present, status: "present" as const },
    { label: "غایب", count: profile.counts.absent, status: "absent" as const },
    { label: "تأخیر", count: profile.counts.late, status: "late" as const },
    { label: "موجه", count: profile.counts.excused, status: "excused" as const },
    { label: "ثبت‌نشده", count: profile.counts.unmarked, status: "unmarked" as const },
  ];

  return (
    <section className="grid gap-4" aria-label="کارنامه حضور این کلاس و کتاب" dir="rtl">
      <header className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4">
        <h3 className="text-lg font-black text-ink">{profile.studentName}</h3>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {profile.className} · {profile.bookName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">استاد: {profile.teacherName}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30 sm:col-span-1 sm:flex-col sm:items-start">
          <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
            مجموع سکه‌های این کلاس و کتاب
          </span>
          <span className="inline-flex items-center gap-2 text-xl font-black text-amber-950 dark:text-amber-100">
            <AttendanceCoin className="size-7 object-contain" />
            {profile.totalCoins.toLocaleString("fa-IR")}
          </span>
        </div>
        <SummaryCard label="کل جلسه‌ها" count={profile.totalSessions} />
        {summaries.map((summary) => (
          <SummaryCard
            key={summary.status}
            label={summary.label}
            count={summary.count}
            className={statusClasses[summary.status]}
          />
        ))}
      </div>

      <section className="grid gap-2" aria-labelledby="teacher-student-attendance-history">
        <div className="flex items-center justify-between gap-2">
          <h4 id="teacher-student-attendance-history" className="text-sm font-black text-ink">
            تاریخچه کامل حضور این کتاب
          </h4>
          <span className="text-xs text-muted-foreground">
            {profile.sessions.length.toLocaleString("fa-IR")} جلسه
          </span>
        </div>
        {profile.sessions.length ? (
          <ol className="grid gap-2">
            {profile.sessions.map((session) => (
              <li
                key={session.sessionId}
                className="grid gap-2 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-ink">{formatDate(session.sessionDate)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{session.title}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClasses[session.status]}`}
                  >
                    {statusLabels[session.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--border-subtle))] pt-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                    سکه این جلسه: {session.coins.toLocaleString("fa-IR")}
                    <AttendanceCoin className="size-5 object-contain" />
                  </span>
                  {session.note ? (
                    <span className="max-w-full text-muted-foreground">{session.note}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="هنوز جلسه‌ای برای این کتاب ثبت نشده است." />
        )}
      </section>
    </section>
  );
}

function SummaryCard({
  label,
  count,
  className = "bg-[rgb(var(--surface-card))] text-ink",
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div
      className={`grid min-h-20 content-center gap-1 rounded-xl border border-[rgb(var(--border-subtle))] p-3 ${className}`}
    >
      <span className="text-xs font-semibold opacity-80">{label}</span>
      <strong className="text-xl font-black">{count.toLocaleString("fa-IR")}</strong>
    </div>
  );
}
