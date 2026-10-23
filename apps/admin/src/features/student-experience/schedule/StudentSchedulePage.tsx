import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSchedule, type ScheduleEntry } from "../../academics/schedule/api/schedule.api";
import { useAuth } from "../../identity/auth";
import { addDays, fa, todayIso } from "../../../shared/lib/utils";
import { DatePicker } from "../../../shared/ui/date-picker";
import { useModal } from "../../../shared/ui/modal";
import { Button, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { useViewportShell } from "../../../app/layout/lib/viewport-shell";
import {
  entriesForStudentDay,
  formatStudentScheduleDate,
  isCurrentStudentLesson,
  scheduleWeekdayForIso,
  shiftStudentScheduleMonth,
  studentScheduleWeekdayOrder,
  studentScheduleWeekdays,
} from "./student-schedule-model";
import "./student-schedule.css";

/** Student schedule owns its query and presentation within the shared portal. */
export function StudentSchedulePage() {
  const auth = useAuth();
  const entries = useQuery({
    queryKey: ["schedule", auth.context?.activeOrganization?.id ?? "all"],
    queryFn: listSchedule,
  });
  if (entries.isLoading) return <LoadingState label="در حال دریافت برنامه…" />;
  if (entries.isError) return <EmptyState title="دریافت برنامه انجام نشد." />;
  return <StudentScheduleContent entries={entries.data ?? []} />;
}

function StudentScheduleContent({ entries }: { entries: ScheduleEntry[] }) {
  const modal = useModal();
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const activeWeekday = scheduleWeekdayForIso(selectedDate);
  const isMobileShell = useViewportShell() === "mobile";
  const activeEntries = useMemo(
    () => entriesForStudentDay(entries, activeWeekday),
    [activeWeekday, entries],
  );
  const openDetails = (entry: ScheduleEntry) =>
    modal.open({
      title: "جزئیات کلاس",
      description: "اطلاعات جلسه انتخاب‌شده در برنامه هفتگی شما",
      size: "md",
      content: <StudentScheduleDetails entry={entry} onClose={modal.close} />,
    });
  const selectedDateLabel = formatStudentScheduleDate(selectedDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const selectedMonthLabel = formatStudentScheduleDate(selectedDate, {
    month: "long",
    year: "numeric",
  });

  return (
    <section
      className="student-schedule mx-auto grid w-full max-w-6xl gap-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-5"
      dir="rtl"
      aria-label="برنامه هفتگی من"
    >
      <header className="student-schedule__header">
        <button
          type="button"
          aria-label="ماه قبل"
          onClick={() => setSelectedDate((date) => shiftStudentScheduleMonth(date, -1))}
          className="student-schedule__header-action"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-base font-black text-[#14254b] dark:text-slate-50">
            {selectedMonthLabel}
          </p>
          <p
            className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300"
            aria-live="polite"
          >
            {selectedDateLabel}
          </p>
        </div>
        <div className="student-schedule__picker">
          <DatePicker
            calendar="persian"
            value={selectedDate}
            onChange={setSelectedDate}
            clearable={false}
            showToday
            ariaLabel="انتخاب تاریخ برنامه"
          />
        </div>
        <button
          type="button"
          aria-label="ماه بعد"
          onClick={() => setSelectedDate((date) => shiftStudentScheduleMonth(date, 1))}
          className="student-schedule__header-action"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      </header>
      {isMobileShell ? (
        <div className="grid grid-cols-[4.6rem_minmax(0,1fr)] items-start gap-3">
          <nav className="student-schedule__weekday-rail" aria-label="انتخاب روز برنامه">
            {studentScheduleWeekdayOrder.map((weekday) => (
              <button
                key={weekday}
                type="button"
                aria-pressed={weekday === activeWeekday}
                onClick={() => setSelectedDate(addDays(selectedDate, weekday - activeWeekday))}
                className={`student-schedule__weekday ${weekday === activeWeekday ? "student-schedule__weekday--active" : ""}`}
              >
                {studentScheduleWeekdays[weekday]}
              </button>
            ))}
          </nav>
          <StudentScheduleList
            entries={activeEntries}
            weekday={activeWeekday}
            selectedDate={selectedDate}
            currentTime={currentTime}
            onOpen={openDetails}
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {studentScheduleWeekdayOrder.map((weekday) => (
            <section key={weekday} className="student-schedule__desktop-day min-w-0">
              <h2 className="text-sm font-black text-[#14254b] dark:text-slate-50">
                {studentScheduleWeekdays[weekday]}
              </h2>
              <StudentScheduleList
                entries={entriesForStudentDay(entries, weekday)}
                weekday={weekday}
                selectedDate={selectedDate}
                currentTime={currentTime}
                onOpen={openDetails}
              />
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentScheduleList({
  entries,
  weekday,
  selectedDate,
  currentTime,
  onOpen,
}: {
  entries: ScheduleEntry[];
  weekday: number;
  selectedDate: string;
  currentTime: Date;
  onOpen: (entry: ScheduleEntry) => void;
}) {
  return (
    <section
      className="student-schedule__lesson-list"
      aria-label={`کلاس‌های ${studentScheduleWeekdays[weekday]}`}
    >
      {entries.map((entry) => (
        <StudentScheduleCard
          key={entry.id}
          entry={entry}
          isCurrent={isCurrentStudentLesson(entry, selectedDate, currentTime)}
          onOpen={() => onOpen(entry)}
        />
      ))}
      {!entries.length ? (
        <div className="student-schedule__empty">
          <CalendarClock size={24} aria-hidden="true" />
          <p>برای {studentScheduleWeekdays[weekday]} کلاسی ثبت نشده است.</p>
        </div>
      ) : null}
    </section>
  );
}

function StudentScheduleCard({
  entry,
  isCurrent,
  onOpen,
}: {
  entry: ScheduleEntry;
  isCurrent: boolean;
  onOpen?: () => void;
}) {
  const content = (
    <span className="flex items-start gap-3">
      <span className="student-schedule__lesson-icon">
        <CalendarClock size={19} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-black text-[#14254b] dark:text-slate-50">
            {entry.title}
          </span>
          {isCurrent ? <span className="student-schedule__live">در حال برگزاری</span> : null}
        </span>
        <span className="mt-1.5 block text-xs font-black text-[#2563eb]" dir="ltr">
          {fa(entry.startTime)} تا {fa(entry.endTime)}
        </span>
        <span className="mt-2 block truncate text-xs text-slate-600 dark:text-slate-300">
          {entry.classroom?.name || entry.room || entry.organization.name}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <GraduationCap size={14} aria-hidden="true" />
          {teacherName(entry) || "استاد این کلاس هنوز ثبت نشده است."}
        </span>
      </span>
    </span>
  );
  return (
    <article
      className={`student-schedule__lesson ${isCurrent ? "student-schedule__lesson--current" : ""}`}
    >
      {onOpen ? (
        <button type="button" onClick={onOpen} className="block w-full text-right">
          {content}
        </button>
      ) : (
        <div className="block w-full text-right">{content}</div>
      )}
    </article>
  );
}

function StudentScheduleDetails({ entry, onClose }: { entry: ScheduleEntry; onClose: () => void }) {
  return (
    <div className="grid gap-4" dir="rtl">
      <StudentScheduleCard entry={entry} isCurrent={false} />
      <dl className="grid gap-2 text-sm">
        <Detail
          icon={GraduationCap}
          label="کلاس"
          value={entry.classroom?.name || "کلاس ثبت نشده"}
        />
        <Detail icon={MapPin} label="فضا / اتاق" value={entry.room || "فضای آموزشی ثبت نشده"} />
        <Detail
          icon={UserRound}
          label="استاد"
          value={teacherName(entry) || "استاد این جلسه ثبت نشده است"}
        />
      </dl>
      <Button variant="ghost" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/70 px-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm dark:bg-white/10">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold text-slate-500">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-black text-ink" title={value}>
          {value}
        </dd>
      </div>
    </div>
  );
}
function teacherName(entry: ScheduleEntry) {
  return !entry.teacher
    ? ""
    : [entry.teacher.firstName, entry.teacher.lastName].filter(Boolean).join(" ") ||
        entry.teacher.username;
}
