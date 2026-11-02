import { CalendarClock, MapPin, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "../../../identity/auth";
import {
  listScheduleByAcademicPeriod,
  listLegacyAcademicCycles,
  type ScheduleEntry,
} from "../../../academics/schedule/api/schedule.api";
import { listTeacherLeaveRequests } from "../../../academics/schedule/api/teacher-leave.api";
import {
  getTeacherWeekAttendanceSummary,
  type TeacherWeekAttendanceSummary,
} from "../../../student-life/attendance/public";
import { Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { AdaptiveSelect } from "../../../../shared/ui/adaptive-select";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";

// Schedule API weekday 0 is Saturday. Keep every schedule audience in the same school-week order.
const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const isoToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());

function schoolWeekday(date: string) {
  return (new Date(`${date}T12:00:00.000Z`).getUTCDay() + 1) % 7;
}

export function teacherSchoolWeekStart(date: string) {
  const start = new Date(`${date}T12:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - schoolWeekday(date));
  return start.toISOString().slice(0, 10);
}

function schoolWeekDate(weekStart: string, weekday: number) {
  const date = new Date(`${weekStart}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + weekday);
  return date.toISOString().slice(0, 10);
}

function entryOccursOnDate(entry: ScheduleEntry, date: string) {
  if (entry.status === "REPLACED") return entry.startsOn === date && entry.endsOn === date;
  return (
    entry.status === "ACTIVE" &&
    (!entry.startsOn || entry.startsOn <= date) &&
    (!entry.endsOn || entry.endsOn >= date)
  );
}

function tehranDateAndTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

function isFutureSession(date: string, startTime: string, now: Date) {
  const today = tehranDateAndTime(now);
  const asciiStartTime = startTime.replace(/[۰-۹٠-٩]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit) % 10),
  );
  return date > today.date || (date === today.date && asciiStartTime > today.time);
}

function formatSchoolDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    calendar: "persian",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

type TeacherSchedulePageProps = {
  entries?: ScheduleEntry[];
  attendanceSummaries?: TeacherWeekAttendanceSummary[];
  weekOfDate?: string;
  now?: Date;
};

/** A read-only, server-scoped weekly timetable for teachers. */
export function TeacherSchedulePage({
  entries: suppliedEntries,
  attendanceSummaries: suppliedAttendanceSummaries,
  weekOfDate,
  now: suppliedNow,
}: TeacherSchedulePageProps) {
  const auth = useAuth();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedClass, setSelectedClass] = useState<ScheduleEntry | null>(null);
  const [selectedClassDate, setSelectedClassDate] = useState<string | undefined>();
  const [yearSelection, setYearSelection] = useState("");
  const [termSelection, setTermSelection] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(weekOfDate ?? isoToday);
  useEffect(() => {
    if (suppliedNow) return;
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [suppliedNow]);
  const now = suppliedNow ?? currentTime;
  const organizationId = auth.context?.activeOrganization?.id;
  const weekStart = teacherSchoolWeekStart(viewDate);
  const weekDates = weekdays.map((_, weekday) => schoolWeekDate(weekStart, weekday));
  const cycles = useQuery({
    queryKey: ["schedule", "teacher-academic-cycles", organizationId],
    queryFn: () => listLegacyAcademicCycles(organizationId!),
    enabled: Boolean(organizationId) && suppliedEntries === undefined,
  });
  const leaves = useQuery({
    queryKey: ["teacher-leaves", "schedule", organizationId],
    queryFn: listTeacherLeaveRequests,
    enabled: Boolean(organizationId) && suppliedEntries === undefined,
  });
  const activeYear = cycles.data?.years.find((year) => year.state === "ACTIVE");
  const selectedYearId = yearSelection || activeYear?.id || "";
  const availableTerms = (cycles.data?.terms ?? []).filter(
    (term) => term.academicYearId === selectedYearId,
  );
  const defaultTermId =
    selectedYearId === activeYear?.id
      ? (availableTerms.find((term) => term.state === "ACTIVE")?.id ?? "")
      : "";
  const selectedTermId = termSelection ?? defaultTermId;
  const schedule = useQuery({
    queryKey: ["schedule", "teacher", organizationId, selectedYearId, selectedTermId],
    queryFn: () =>
      listScheduleByAcademicPeriod({
        ...(selectedYearId ? { academicYearId: selectedYearId } : {}),
        ...(selectedTermId ? { termId: selectedTermId } : {}),
      }),
    enabled: suppliedEntries === undefined && cycles.isSuccess,
  });
  const attendanceSummary = useQuery({
    queryKey: ["attendance", "teacher-week-summary", organizationId, weekStart],
    queryFn: () => getTeacherWeekAttendanceSummary(organizationId!, weekStart),
    enabled: suppliedAttendanceSummaries === undefined && Boolean(organizationId),
  });
  const attendanceSummaries = suppliedAttendanceSummaries ?? attendanceSummary.data ?? [];
  const summariesByOccurrence = new Map(
    attendanceSummaries.map((summary) => [`${summary.entryId}:${summary.date}`, summary]),
  );
  const entries = (suppliedEntries ?? schedule.data ?? []).filter(
    (entry) =>
      (!selectedYearId || entry.academicYearId === selectedYearId) &&
      (!selectedTermId || entry.termId === selectedTermId),
  );
  const weeklyEntries = entries.filter((entry) =>
    weekDates.some(
      (date) => entry.weekday === schoolWeekday(date) && entryOccursOnDate(entry, date),
    ),
  );
  const selectedClassTerm = cycles.data?.terms.find((term) => term.id === selectedClass?.termId);
  const canManageSelectedClass =
    auth.can("attendance.manage") || auth.can("attendance.class.manage");
  const leaveForDate = (date: string) =>
    (leaves.data ?? []).find(
      (leave) =>
        leave.status === "approved" &&
        leave.startDate <= date &&
        leave.endDate >= date &&
        !(leave.returnStatus === "approved" && leave.returnDate && leave.returnDate <= date),
    );
  const hasLeaveThisWeek = weekDates.some((date) => Boolean(leaveForDate(date)));

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4" dir="rtl">
      <section className="flex items-start gap-3 px-1 pt-1">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand/10 text-brand">
          <CalendarClock size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="sr-only">برنامه هفتگی من</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            برای دیدن دانش‌آموزان و ثبت حضور، یک کلاس را انتخاب کنید.
          </p>
        </div>
        <label className="ms-auto grid gap-1 text-xs font-bold text-slate-600">
          هفتهٔ برنامه بر اساس تاریخ
          <DatePicker calendar="persian" value={viewDate} onChange={setViewDate} />
        </label>
      </section>
      {hasLeaveThisWeek ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-500/50 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-950 dark:bg-amber-950/35 dark:text-amber-100"
        >
          شما در بازهٔ مرخصی تأییدشده هستید؛ جلسه‌های این تاریخ تا تأیید بازگشت زودتر، قابل ثبت حضور
          نیستند.
        </p>
      ) : null}
      {attendanceSummary.isError && suppliedAttendanceSummaries === undefined ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
        >
          وضعیت حضور جلسه‌ها دریافت نشد؛ برای دیدن آخرین وضعیت، دوباره صفحه را بارگذاری کنید.
        </p>
      ) : null}
      <section
        className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 sm:grid-cols-2"
        aria-label="انتخاب سال تحصیلی و نیم‌سال برنامه"
      >
        <label className="grid gap-1 text-xs font-bold text-ink">
          سال تحصیلی
          <AdaptiveSelect
            value={selectedYearId}
            onChange={(event) => {
              setYearSelection(event.target.value);
              setTermSelection(null);
            }}
            disabled={cycles.isLoading || !cycles.data?.years.length}
          >
            {!cycles.data?.years.length ? <option value="">سالی ثبت نشده است</option> : null}
            {(cycles.data?.years ?? []).map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
                {year.state === "ACTIVE" ? " · فعال" : ""}
              </option>
            ))}
          </AdaptiveSelect>
        </label>
        <label className="grid gap-1 text-xs font-bold text-ink">
          نیم‌سال
          <AdaptiveSelect
            value={selectedTermId}
            onChange={(event) => setTermSelection(event.target.value)}
            disabled={!selectedYearId || !availableTerms.length}
          >
            <option value="">همهٔ نیم‌سال‌های سال</option>
            {availableTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.state === "ACTIVE" ? " · فعال" : ""}
              </option>
            ))}
          </AdaptiveSelect>
        </label>
        {cycles.isError ? (
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 sm:col-span-2">
            سال و نیم‌سال‌های مدرسه دریافت نشدند؛ دوباره صفحه را بارگذاری کنید.
          </p>
        ) : null}
      </section>
      {suppliedEntries === undefined && (schedule.isLoading || cycles.isLoading) ? (
        <LoadingState label="در حال دریافت برنامه هفتگی…" />
      ) : suppliedEntries === undefined && (schedule.isError || cycles.isError) ? (
        <EmptyState title="سال تحصیلی، نیم‌سال یا برنامه هفتگی دریافت نشد." />
      ) : !weeklyEntries.length ? (
        <EmptyState title="کلاسی در برنامه شما ثبت نشده است." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-3">
          {weekdays.map((day, weekday) => {
            const occurrenceDate = weekDates[weekday];
            const dayEntries = weeklyEntries.filter(
              (entry) => entry.weekday === weekday && entryOccursOnDate(entry, occurrenceDate),
            );
            return (
              <Card key={day} className="min-w-0 p-3">
                <h3 className="min-h-11 pt-2 text-sm font-black text-ink">
                  {day}
                  <span className="ms-2 text-[11px] font-medium text-slate-500">
                    {formatSchoolDate(occurrenceDate)}
                  </span>
                </h3>
                {dayEntries.length ? (
                  <ul className="mt-3 grid gap-2">
                    {dayEntries.map((entry) => {
                      const summary = summariesByOccurrence.get(`${entry.id}:${occurrenceDate}`);
                      const status = isFutureSession(occurrenceDate, entry.startTime, now)
                        ? "future"
                        : summary?.attendanceRecorded
                          ? "complete"
                          : summary
                            ? "incomplete"
                            : "unknown";
                      const statusClassName =
                        status === "future"
                          ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20"
                          : status === "complete"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : status === "incomplete"
                              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20"
                              : "border-[rgb(var(--border-subtle))]";
                      const statusLabel =
                        status === "future"
                          ? "آینده"
                          : status === "complete"
                            ? "حضور ثبت شد"
                            : status === "incomplete"
                              ? "حضور ثبت نشده"
                              : "وضعیت در حال دریافت";
                      const badgeClassName =
                        status === "future"
                          ? "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100"
                          : status === "complete"
                            ? "bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100"
                            : status === "incomplete"
                              ? "bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-100"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
                      const leave = leaveForDate(occurrenceDate);
                      const mostRecentMissedDate = summary?.mostRecentUnmarkedDate;
                      return (
                        <li key={entry.id} className="grid gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClass(entry);
                              setSelectedClassDate(occurrenceDate);
                            }}
                            className={`w-full rounded-xl border-2 ${statusClassName} p-3 text-right outline-none transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${badgeClassName}`}
                                aria-label={
                                  summary
                                    ? `${summary.unmarkedCount} دانش‌آموز بدون وضعیت حضور`
                                    : "تعداد دانش‌آموزان در حال دریافت"
                                }
                              >
                                {summary
                                  ? `${summary.unmarkedCount.toLocaleString("fa-IR")} نفر مانده`
                                  : "— نفر مانده"}
                              </span>
                              <span className="shrink-0 text-xs font-bold text-brand">
                                {entry.startTime}
                              </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin size={13} aria-hidden="true" />
                              {entry.room || entry.classroom?.name || "محل ثبت نشده"}
                            </p>
                            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                              <UsersRound size={13} aria-hidden="true" />
                              {statusLabel} · فهرست کلاس و حضور
                            </p>
                            {entry.status === "REPLACED" ? (
                              <p className="mt-1 text-[11px] font-bold text-amber-700">
                                جلسه جایگزین یک‌باره · {entry.startsOn}
                              </p>
                            ) : null}
                            {leave && entry.status === "ACTIVE" ? (
                              <p className="mt-1 text-[11px] font-black text-amber-800 dark:text-amber-200">
                                مرخصی تأییدشده · ثبت حضور تا تأیید بازگشت غیرفعال است
                              </p>
                            ) : null}
                          </button>
                          {summary?.pastUnmarkedCount && mostRecentMissedDate ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClass(entry);
                                setSelectedClassDate(mostRecentMissedDate);
                              }}
                              className="min-h-10 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-right text-xs font-bold text-rose-900 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100 dark:hover:bg-rose-950/60"
                            >
                              {summary.pastUnmarkedCount.toLocaleString("fa-IR")} جلسه گذشته بدون
                              حضور · ثبت از آخرین جلسه
                            </button>
                          ) : summary?.pastUnmarkedCount === 0 ? (
                            <p className="px-2 text-[11px] text-slate-500">
                              جلسه گذشتهٔ بدون حضور ندارید
                            </p>
                          ) : summary?.pastUnmarkedCount === null ? (
                            <p className="px-2 text-[11px] text-slate-500">
                              بازهٔ نیم‌سال برای شمارش جلسه‌های گذشته مشخص نیست
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-4 text-center text-xs text-slate-500">
                    کلاسی ندارید
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <TeacherClassAttendanceSheet
        entry={selectedClass}
        open={Boolean(selectedClass)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedClass(null);
            setSelectedClassDate(undefined);
          }
        }}
        canManage={canManageSelectedClass}
        initialDate={selectedClassDate}
        semesterStartsOn={selectedClassTerm?.startsOn}
        semesterEndsOn={selectedClassTerm?.endsOn}
      />
    </section>
  );
}
