import { CalendarClock, MapPin, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import {
  listScheduleByAcademicPeriod,
  listLegacyAcademicCycles,
  type ScheduleEntry,
} from "../../../academics/schedule/api/schedule.api";
import { Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { AdaptiveSelect } from "../../../../shared/ui/adaptive-select";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";

// Schedule API weekday 0 is Saturday. Keep every schedule audience in the same school-week order.
const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const isoToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());

/** A read-only, server-scoped weekly timetable for teachers. */
export function TeacherSchedulePage({ entries: suppliedEntries }: { entries?: ScheduleEntry[] }) {
  const auth = useAuth();
  const [selectedClass, setSelectedClass] = useState<ScheduleEntry | null>(null);
  const [yearSelection, setYearSelection] = useState("");
  const [termSelection, setTermSelection] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(isoToday);
  const organizationId = auth.context?.activeOrganization?.id;
  const cycles = useQuery({
    queryKey: ["schedule", "teacher-academic-cycles", organizationId],
    queryFn: () => listLegacyAcademicCycles(organizationId!),
    enabled: Boolean(organizationId),
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
  const entries = (suppliedEntries ?? schedule.data ?? []).filter(
    (entry) =>
      (!selectedYearId || entry.academicYearId === selectedYearId) &&
      (!selectedTermId || entry.termId === selectedTermId),
  );
  const active = entries.filter(
    (entry) =>
      entry.status === "ACTIVE" ||
      (entry.status === "REPLACED" && entry.startsOn === viewDate && entry.endsOn === viewDate),
  );
  const selectedClassYear = cycles.data?.years.find(
    (year) => year.id === selectedClass?.academicYearId,
  );
  const selectedClassTerm = cycles.data?.terms.find((term) => term.id === selectedClass?.termId);
  const canManageSelectedClass =
    auth.can("attendance.manage") &&
    Boolean(selectedClassYear && selectedClassTerm) &&
    selectedClassYear?.state !== "ARCHIVED" &&
    selectedClassTerm?.state !== "ARCHIVED" &&
    !selectedClassTerm?.correctionOpen;

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
          تاریخ مشاهده جلسه جایگزین
          <DatePicker calendar="persian" value={viewDate} onChange={setViewDate} />
        </label>
      </section>
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
      ) : !active.length ? (
        <EmptyState title="کلاسی در برنامه شما ثبت نشده است." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-3">
          {weekdays.map((day, weekday) => {
            const dayEntries = active.filter((entry) => entry.weekday === weekday);
            return (
              <Card key={day} className="min-w-0 p-3">
                <h3 className="min-h-11 pt-2 text-sm font-black text-ink">{day}</h3>
                {dayEntries.length ? (
                  <ul className="mt-3 grid gap-2">
                    {dayEntries.map((entry) => (
                      <li key={entry.id} className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedClass(entry)}
                          className="w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3 text-right outline-none transition hover:border-brand/40 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
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
                            فهرست کلاس و حضور
                          </p>
                          {entry.status === "REPLACED" ? (
                            <p className="mt-1 text-[11px] font-bold text-amber-700">
                              جلسه جایگزین یک‌باره · {entry.startsOn}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    ))}
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
        onOpenChange={(open) => !open && setSelectedClass(null)}
        canManage={canManageSelectedClass}
        semesterStartsOn={selectedClassTerm?.startsOn}
        semesterEndsOn={selectedClassTerm?.endsOn}
      />
    </section>
  );
}
