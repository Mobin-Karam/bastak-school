import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSchedule, type ScheduleEntry } from "../../academics/schedule/api/schedule.api";
import { useAuth } from "../../identity/auth";
import { fa } from "../../../shared/lib/utils";
import { DatePicker } from "../../../shared/ui/date-picker";
import { useModal } from "../../../shared/ui/modal";
import { Button, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { useViewportShell } from "../../../app/layout/lib/viewport-shell";
import {
  entriesForStudentDay,
  formatStudentScheduleDate,
  isCurrentStudentLesson,
  scheduleWeekdayForIso,
  schoolTodayIso,
  shiftStudentScheduleMonth,
  studentScheduleDateForWeekday,
  studentScheduleWeekdayOrder,
  studentScheduleWeekdays,
} from "./student-schedule-model";
import "./student-schedule.css";

/** Student-facing view. Student authorization/filtering must be enforced by the API. */
export function StudentSchedulePage() {
  const auth = useAuth();
  const organizationId = auth.context?.activeOrganization?.id;
  const query = useQuery({
    queryKey: ["schedule", organizationId ?? "all"],
    queryFn: listSchedule,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  if (query.isPending) return <LoadingState label="در حال دریافت برنامه…" />;
  if (query.isError) {
    return (
      <section className="mx-auto grid max-w-lg gap-3 py-8" dir="rtl">
        <EmptyState title="دریافت برنامه انجام نشد." />
        <Button onClick={() => void query.refetch()}>
          <RotateCcw size={16} aria-hidden="true" /> تلاش دوباره
        </Button>
      </section>
    );
  }
  return <StudentScheduleContent entries={query.data ?? []} />;
}

function StudentScheduleContent({ entries }: { entries: ScheduleEntry[] }) {
  const modal = useModal();
  const mobile = useViewportShell() === "mobile";
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => schoolTodayIso());
  const [followToday, setFollowToday] = useState(true);
  const today = schoolTodayIso(currentTime);
  const activeWeekday = scheduleWeekdayForIso(selectedDate);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date());
    const id = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (followToday) setSelectedDate(today);
  }, [followToday, today]);

  const byWeekday = useMemo(
    () => studentScheduleWeekdayOrder.map((day) => entriesForStudentDay(entries, day)),
    [entries],
  );
  const activeEntries = byWeekday[activeWeekday];
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

  function chooseDate(date: string) {
    setSelectedDate(date);
    setFollowToday(false);
  }

  function openDetails(entry: ScheduleEntry, lessonDate: string) {
    modal.open({
      title: "جزئیات کلاس",
      description: "اطلاعات جلسه انتخاب‌شده در برنامه هفتگی شما",
      size: "md",
      content: <StudentScheduleDetails entry={entry} date={lessonDate} onClose={modal.close} />,
    });
  }

  return (
    <section
      className="student-schedule mx-auto grid w-full max-w-6xl gap-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-5"
      dir="rtl"
      aria-label="برنامه هفتگی من"
    >
      <header className="student-schedule__header">
        <div className="student-schedule__month-controls">
          <button
            type="button"
            aria-label="ماه قبل"
            onClick={() => chooseDate(shiftStudentScheduleMonth(selectedDate, -1))}
            className="student-schedule__header-action"
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-base font-black text-[#14254b] dark:text-slate-50">
              {selectedMonthLabel}
            </h1>
            <p
              className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300"
              aria-live="polite"
            >
              {selectedDateLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label="ماه بعد"
            onClick={() => chooseDate(shiftStudentScheduleMonth(selectedDate, 1))}
            className="student-schedule__header-action"
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="student-schedule__header-tools">
          <button
            type="button"
            className="student-schedule__today"
            onClick={() => {
              setFollowToday(true);
              setSelectedDate(schoolTodayIso());
            }}
            aria-label="بازگشت به امروز"
            disabled={selectedDate === today && followToday}
          >
            امروز
          </button>
          <div className="student-schedule__picker">
            <DatePicker
              calendar="persian"
              value={selectedDate}
              onChange={(nextDate) => {
                if (nextDate) chooseDate(nextDate);
              }}
              clearable={false}
              showToday
              ariaLabel="انتخاب تاریخ برنامه"
            />
          </div>
        </div>
      </header>

      <div className="student-schedule__summary" aria-live="polite">
        <span>
          <CalendarDays size={16} aria-hidden="true" /> {studentScheduleWeekdays[activeWeekday]}
        </span>
        <span>{fa(activeEntries.length)} کلاس ثبت‌شده</span>
      </div>

      {mobile ? (
        <div className="student-schedule__mobile-layout">
          <nav className="student-schedule__weekday-rail" aria-label="انتخاب روز برنامه">
            {studentScheduleWeekdayOrder.map((weekday) => {
              const dayDate = studentScheduleDateForWeekday(selectedDate, weekday);
              const isActive = weekday === activeWeekday;
              return (
                <button
                  key={weekday}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${studentScheduleWeekdays[weekday]}، ${formatStudentScheduleDate(dayDate, { day: "numeric", month: "long" })}، ${byWeekday[weekday].length} کلاس`}
                  onClick={() => chooseDate(dayDate)}
                  className={`student-schedule__weekday ${isActive ? "student-schedule__weekday--active" : ""}`}
                >
                  <span className="student-schedule__weekday-name">
                    {studentScheduleWeekdays[weekday]}
                  </span>
                  <span className="student-schedule__weekday-date">
                    {formatStudentScheduleDate(dayDate, { day: "numeric" })}
                  </span>
                  <span className="student-schedule__weekday-count">
                    {fa(byWeekday[weekday].length)} کلاس
                  </span>
                  {dayDate === today && (
                    <span className="student-schedule__today-dot" aria-label="امروز" />
                  )}
                </button>
              );
            })}
          </nav>
          <StudentScheduleList
            entries={activeEntries}
            date={selectedDate}
            currentTime={currentTime}
            onOpen={openDetails}
          />
        </div>
      ) : (
        <div className="student-schedule__desktop-grid">
          {studentScheduleWeekdayOrder.map((weekday) => {
            const date = studentScheduleDateForWeekday(selectedDate, weekday);
            return (
              <section
                key={weekday}
                className="student-schedule__desktop-day min-w-0"
                aria-label={`کلاس‌های ${studentScheduleWeekdays[weekday]}`}
              >
                <div className="student-schedule__desktop-day-heading">
                  <div>
                    <h2 className="text-sm font-black text-[#14254b] dark:text-slate-50">
                      {studentScheduleWeekdays[weekday]}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                      {formatStudentScheduleDate(date, { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <span className="student-schedule__day-count">
                    {fa(byWeekday[weekday].length)}
                  </span>
                </div>
                <StudentScheduleList
                  entries={byWeekday[weekday]}
                  date={date}
                  currentTime={currentTime}
                  onOpen={openDetails}
                />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StudentScheduleList({
  entries,
  date,
  currentTime,
  onOpen,
}: {
  entries: ScheduleEntry[];
  date: string;
  currentTime: Date;
  onOpen: (entry: ScheduleEntry, date: string) => void;
}) {
  return (
    <section
      className="student-schedule__lesson-list"
      aria-label={`کلاس‌های ${studentScheduleWeekdays[scheduleWeekdayForIso(date)]}`}
    >
      {entries.map((entry) => (
        <StudentScheduleCard
          key={entry.id}
          entry={entry}
          isCurrent={isCurrentStudentLesson(entry, date, currentTime)}
          onOpen={() => onOpen(entry, date)}
        />
      ))}
      {!entries.length && (
        <div className="student-schedule__empty" role="status">
          <CalendarClock size={26} aria-hidden="true" />
          <p>برای این روز کلاسی ثبت نشده است.</p>
        </div>
      )}
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
  const teacher = teacherName(entry);
  const content = (
    <span className="student-schedule__lesson-inner">
      <span className="student-schedule__lesson-icon">
        <CalendarClock size={19} aria-hidden="true" />
      </span>
      <span className="student-schedule__lesson-main">
        <span className="student-schedule__lesson-top">
          <span className="student-schedule__lesson-title">{entry.title}</span>
          {isCurrent && <span className="student-schedule__live">در حال برگزاری</span>}
        </span>
        <span className="student-schedule__lesson-time">
          <Clock3 size={13} aria-hidden="true" />
          <span dir="ltr">
            {fa(entry.startTime)} تا {fa(entry.endTime)}
          </span>
        </span>
        <span className="student-schedule__lesson-meta">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {entry.classroom?.name || entry.room || entry.organization?.name || "مکان نامشخص"}
          </span>
        </span>
        <span className="student-schedule__lesson-meta">
          <GraduationCap size={14} aria-hidden="true" />
          <span>{teacher || "استاد ثبت نشده است"}</span>
        </span>
      </span>
    </span>
  );
  return (
    <article
      className={`student-schedule__lesson ${isCurrent ? "student-schedule__lesson--current" : ""}`}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="student-schedule__lesson-button"
          aria-label={`جزئیات ${entry.title}، ساعت ${entry.startTime} تا ${entry.endTime}`}
        >
          {content}
        </button>
      ) : (
        <div className="student-schedule__lesson-button">{content}</div>
      )}
    </article>
  );
}

function StudentScheduleDetails({
  entry,
  date,
  onClose,
}: {
  entry: ScheduleEntry;
  date: string;
  onClose: () => void;
}) {
  return (
    <div className="grid gap-4" dir="rtl">
      <StudentScheduleCard entry={entry} isCurrent={false} />
      <dl className="grid gap-2 text-sm">
        <Detail
          icon={CalendarDays}
          label="تاریخ"
          value={formatStudentScheduleDate(date, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />
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
        <dt className="text-[11px] font-bold text-slate-500 dark:text-slate-300">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-black text-ink" title={value}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function teacherName(entry: ScheduleEntry) {
  const teacher = entry.teacher ?? entry.classBook?.teacher;
  if (!teacher) return "";
  return [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || teacher.username;
}
